"""
Papaya Growth Stage Classification using Vision Transformer (ViT)
Classifies papaya trees into 4 growth stages: a, b, c, d
Uses advanced ViT with multi-scale attention and custom augmentation pipeline
"""

import os
import json
import time
import copy
import warnings
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
import seaborn as sns
from pathlib import Path
from datetime import datetime

import torch
import torch.nn as nn
import torch.nn.functional as F
import torch.optim as optim
from torch.optim.lr_scheduler import CosineAnnealingWarmRestarts, OneCycleLR
from torch.utils.data import DataLoader, Dataset, WeightedRandomSampler
from torch.cuda.amp import GradScaler, autocast

import torchvision
from torchvision import transforms, datasets, models
from torchvision.transforms import functional as TF

from sklearn.metrics import (
    classification_report, confusion_matrix,
    roc_auc_score, roc_curve, precision_recall_curve,
    average_precision_score
)
from sklearn.preprocessing import label_binarize

import timm  # pip install timm

warnings.filterwarnings('ignore')

# ─────────────────────────────────────────────
# CONFIGURATION
# ─────────────────────────────────────────────
CONFIG = {
    # Paths
    "data_dir": "data",
    "output_dir": "outputs",
    "model_save_path": "outputs/papaya_vit_best.pth",
    "checkpoint_path": "outputs/checkpoint_last.pth",
    "plots_dir": "outputs/plots",

    # Classes (papaya growth stages)
    "classes": ["a", "b", "c", "d"],
    "class_names": {
        "a": "Stage A – Seedling",
        "b": "Stage B – Juvenile",
        "c": "Stage C – Pre-fruiting",
        "d": "Stage D – Fruiting"
    },

    # Model
    "model_name": "vit_base_patch16_224",   # timm model name
    "image_size": 224,
    "patch_size": 16,
    "num_classes": 4,
    "pretrained": True,

    # Training
    "epochs": 60,
    "batch_size": 16,
    "num_workers": 4,
    "val_split": 0.2,
    "seed": 42,

    # Optimizer
    "optimizer": "adamw",
    "lr": 2e-4,
    "weight_decay": 1e-4,
    "scheduler": "cosine",
    "warmup_epochs": 5,
    "min_lr": 1e-6,

    # Advanced
    "use_amp": True,           # Automatic Mixed Precision
    "label_smoothing": 0.1,
    "mixup_alpha": 0.4,
    "cutmix_alpha": 1.0,
    "use_tta": True,           # Test-Time Augmentation
    "grad_clip": 1.0,
    "early_stopping_patience": 15,

    # Feature extraction approach
    "freeze_epochs": 5,        # freeze backbone for first N epochs, then fine-tune all
}

# ─────────────────────────────────────────────
# REPRODUCIBILITY
# ─────────────────────────────────────────────
def set_seed(seed):
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)
    np.random.seed(seed)
    torch.backends.cudnn.deterministic = True
    torch.backends.cudnn.benchmark = False

set_seed(CONFIG["seed"])

# ─────────────────────────────────────────────
# DEVICE
# ─────────────────────────────────────────────
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using device: {device}")

# ─────────────────────────────────────────────
# DIRECTORIES
# ─────────────────────────────────────────────
os.makedirs(CONFIG["output_dir"], exist_ok=True)
os.makedirs(CONFIG["plots_dir"], exist_ok=True)

# ─────────────────────────────────────────────
# AUGMENTATION PIPELINES
# ─────────────────────────────────────────────
IMG_MEAN = [0.485, 0.456, 0.406]
IMG_STD  = [0.229, 0.224, 0.225]

train_transform = transforms.Compose([
    transforms.RandomResizedCrop(CONFIG["image_size"], scale=(0.6, 1.0),
                                  ratio=(0.75, 1.33)),
    transforms.RandomHorizontalFlip(p=0.5),
    transforms.RandomVerticalFlip(p=0.2),
    transforms.RandomRotation(degrees=30),
    transforms.ColorJitter(brightness=0.3, contrast=0.3,
                           saturation=0.3, hue=0.1),
    transforms.RandomGrayscale(p=0.05),
    transforms.RandomApply([transforms.GaussianBlur(kernel_size=5)], p=0.2),
    transforms.RandomPerspective(distortion_scale=0.3, p=0.3),
    transforms.ToTensor(),
    transforms.Normalize(IMG_MEAN, IMG_STD),
    transforms.RandomErasing(p=0.2, scale=(0.02, 0.2)),
])

val_transform = transforms.Compose([
    transforms.Resize(int(CONFIG["image_size"] * 1.14)),
    transforms.CenterCrop(CONFIG["image_size"]),
    transforms.ToTensor(),
    transforms.Normalize(IMG_MEAN, IMG_STD),
])

# TTA transforms (multiple crops/flips at inference)
tta_transforms = [
    transforms.Compose([
        transforms.Resize(CONFIG["image_size"]),
        transforms.CenterCrop(CONFIG["image_size"]),
        transforms.ToTensor(),
        transforms.Normalize(IMG_MEAN, IMG_STD),
    ]),
    transforms.Compose([
        transforms.Resize(CONFIG["image_size"]),
        transforms.CenterCrop(CONFIG["image_size"]),
        transforms.RandomHorizontalFlip(p=1.0),
        transforms.ToTensor(),
        transforms.Normalize(IMG_MEAN, IMG_STD),
    ]),
    transforms.Compose([
        transforms.Resize(int(CONFIG["image_size"] * 1.2)),
        transforms.CenterCrop(CONFIG["image_size"]),
        transforms.ToTensor(),
        transforms.Normalize(IMG_MEAN, IMG_STD),
    ]),
    transforms.Compose([
        transforms.Resize(int(CONFIG["image_size"] * 0.85)),
        transforms.Pad(int(CONFIG["image_size"] * 0.075)),
        transforms.CenterCrop(CONFIG["image_size"]),
        transforms.ToTensor(),
        transforms.Normalize(IMG_MEAN, IMG_STD),
    ]),
]

# ─────────────────────────────────────────────
# DATASET LOADING
# ─────────────────────────────────────────────
def load_datasets(data_dir, val_split=0.2):
    """Load ImageFolder datasets with train/val split."""
    full_dataset = datasets.ImageFolder(root=data_dir, transform=train_transform)

    total = len(full_dataset)
    val_size = int(total * val_split)
    train_size = total - val_size

    indices = list(range(total))
    np.random.shuffle(indices)
    train_idx = indices[:train_size]
    val_idx   = indices[train_size:]

    train_set = torch.utils.data.Subset(full_dataset, train_idx)

    # Validation set uses val transform
    val_full  = datasets.ImageFolder(root=data_dir, transform=val_transform)
    val_set   = torch.utils.data.Subset(val_full, val_idx)

    # Weighted sampler for class imbalance
    class_counts = np.bincount([full_dataset.targets[i] for i in train_idx])
    class_weights = 1.0 / (class_counts + 1e-6)
    sample_weights = [class_weights[full_dataset.targets[i]] for i in train_idx]
    sampler = WeightedRandomSampler(sample_weights, num_samples=len(train_idx),
                                    replacement=True)

    train_loader = DataLoader(train_set, batch_size=CONFIG["batch_size"],
                              sampler=sampler, num_workers=CONFIG["num_workers"],
                              pin_memory=True)
    val_loader   = DataLoader(val_set,   batch_size=CONFIG["batch_size"],
                              shuffle=False, num_workers=CONFIG["num_workers"],
                              pin_memory=True)

    print(f"Dataset: {total} images | Train: {train_size} | Val: {val_size}")
    print(f"Class distribution: {dict(zip(CONFIG['classes'], class_counts))}")
    return train_loader, val_loader, full_dataset.class_to_idx

# ─────────────────────────────────────────────
# MODEL: Enhanced ViT with Attention Pooling
# ─────────────────────────────────────────────
class AttentionPool(nn.Module):
    """Attention-based pooling over patch tokens."""
    def __init__(self, dim, num_heads=8):
        super().__init__()
        self.attn = nn.MultiheadAttention(dim, num_heads, batch_first=True)
        self.query = nn.Parameter(torch.randn(1, 1, dim))
        self.norm  = nn.LayerNorm(dim)

    def forward(self, x):
        # x: (B, N, D) — patch tokens
        q = self.query.expand(x.size(0), -1, -1)
        out, _ = self.attn(q, x, x)
        return self.norm(out.squeeze(1))


class PapayaViT(nn.Module):
    """
    Vision Transformer for Papaya Growth Stage Classification.
    Uses timm's ViT backbone + attention pooling head + auxiliary classifier.
    """
    def __init__(self, model_name, num_classes, pretrained=True):
        super().__init__()
        self.backbone = timm.create_model(
            model_name,
            pretrained=pretrained,
            num_classes=0,          # remove default head
            global_pool='',         # keep all patch tokens
        )
        dim = self.backbone.embed_dim

        # Attention pooling over patch tokens
        self.attn_pool = AttentionPool(dim, num_heads=8)

        # Main classifier head
        self.head = nn.Sequential(
            nn.Linear(dim, 512),
            nn.GELU(),
            nn.Dropout(0.3),
            nn.Linear(512, 256),
            nn.GELU(),
            nn.Dropout(0.2),
            nn.Linear(256, num_classes)
        )

        # Auxiliary head on CLS token (used only during training for extra supervision)
        self.aux_head = nn.Sequential(
            nn.LayerNorm(dim),
            nn.Linear(dim, num_classes)
        )

    def forward(self, x, return_aux=False):
        feats = self.backbone.forward_features(x)      # (B, N+1, D)
        cls_token   = feats[:, 0]                      # CLS
        patch_tokens = feats[:, 1:]                    # patch tokens

        pooled = self.attn_pool(patch_tokens)
        logits = self.head(pooled)

        if return_aux:
            aux_logits = self.aux_head(cls_token)
            return logits, aux_logits
        return logits

    def freeze_backbone(self):
        for p in self.backbone.parameters():
            p.requires_grad = False

    def unfreeze_backbone(self):
        for p in self.backbone.parameters():
            p.requires_grad = True


# ─────────────────────────────────────────────
# MIXUP / CUTMIX
# ─────────────────────────────────────────────
def mixup_data(x, y, alpha=0.4):
    if alpha > 0:
        lam = np.random.beta(alpha, alpha)
    else:
        lam = 1
    bs = x.size(0)
    idx = torch.randperm(bs, device=x.device)
    mixed_x = lam * x + (1 - lam) * x[idx]
    y_a, y_b = y, y[idx]
    return mixed_x, y_a, y_b, lam


def cutmix_data(x, y, alpha=1.0):
    lam = np.random.beta(alpha, alpha)
    bs = x.size(0)
    idx = torch.randperm(bs, device=x.device)

    W, H = x.size(-1), x.size(-2)
    cut_ratio = np.sqrt(1 - lam)
    cut_w = int(W * cut_ratio)
    cut_h = int(H * cut_ratio)

    cx = np.random.randint(W)
    cy = np.random.randint(H)
    x1 = np.clip(cx - cut_w // 2, 0, W)
    x2 = np.clip(cx + cut_w // 2, 0, W)
    y1 = np.clip(cy - cut_h // 2, 0, H)
    y2 = np.clip(cy + cut_h // 2, 0, H)

    mixed_x = x.clone()
    mixed_x[:, :, y1:y2, x1:x2] = x[idx, :, y1:y2, x1:x2]
    lam = 1 - (x2 - x1) * (y2 - y1) / (W * H)
    return mixed_x, y, y[idx], lam


def mixup_criterion(criterion, pred, y_a, y_b, lam):
    return lam * criterion(pred, y_a) + (1 - lam) * criterion(pred, y_b)


# ─────────────────────────────────────────────
# TRAINING LOOP
# ─────────────────────────────────────────────
def train_one_epoch(model, loader, optimizer, criterion, scaler, epoch):
    model.train()
    total_loss, correct, total = 0., 0, 0
    use_mix = True

    for batch_idx, (imgs, labels) in enumerate(loader):
        imgs, labels = imgs.to(device), labels.to(device)

        # Randomly apply Mixup or CutMix
        r = np.random.rand()
        if use_mix and r < 0.5:
            if r < 0.25:
                imgs, y_a, y_b, lam = mixup_data(imgs, labels, CONFIG["mixup_alpha"])
            else:
                imgs, y_a, y_b, lam = cutmix_data(imgs, labels, CONFIG["cutmix_alpha"])
            mixed = True
        else:
            y_a, y_b, lam = labels, labels, 1.0
            mixed = False

        optimizer.zero_grad()
        with autocast(enabled=CONFIG["use_amp"]):
            logits, aux_logits = model(imgs, return_aux=True)
            if mixed:
                loss_main = mixup_criterion(criterion, logits, y_a, y_b, lam)
                loss_aux  = mixup_criterion(criterion, aux_logits, y_a, y_b, lam)
            else:
                loss_main = criterion(logits, labels)
                loss_aux  = criterion(aux_logits, labels)
            loss = loss_main + 0.3 * loss_aux

        scaler.scale(loss).backward()
        scaler.unscale_(optimizer)
        torch.nn.utils.clip_grad_norm_(model.parameters(), CONFIG["grad_clip"])
        scaler.step(optimizer)
        scaler.update()

        total_loss += loss.item() * imgs.size(0)
        preds = logits.argmax(1)
        correct += (preds == labels).sum().item()
        total += imgs.size(0)

    return total_loss / total, 100. * correct / total


@torch.no_grad()
def validate(model, loader, criterion):
    model.eval()
    total_loss, correct, total = 0., 0, 0
    all_preds, all_labels, all_probs = [], [], []

    for imgs, labels in loader:
        imgs, labels = imgs.to(device), labels.to(device)
        with autocast(enabled=CONFIG["use_amp"]):
            logits = model(imgs)
            loss   = criterion(logits, labels)

        total_loss += loss.item() * imgs.size(0)
        probs = F.softmax(logits, dim=1)
        preds = probs.argmax(1)
        correct += (preds == labels).sum().item()
        total   += imgs.size(0)
        all_preds.extend(preds.cpu().numpy())
        all_labels.extend(labels.cpu().numpy())
        all_probs.extend(probs.cpu().numpy())

    return (total_loss / total, 100. * correct / total,
            np.array(all_preds), np.array(all_labels), np.array(all_probs))


# ─────────────────────────────────────────────
# TTA INFERENCE
# ─────────────────────────────────────────────
@torch.no_grad()
def tta_predict(model, loader, tta_transforms_list):
    """Predict using test-time augmentation."""
    model.eval()
    all_probs, all_labels = [], []

    # We need raw PIL images — re-load without transforms
    dataset = loader.dataset
    raw_ds  = dataset.dataset if hasattr(dataset, 'dataset') else dataset
    indices = dataset.indices if hasattr(dataset, 'indices') else range(len(dataset))

    from PIL import Image
    all_avg_probs = []
    all_true = []

    for idx in indices:
        path, label = raw_ds.samples[idx]
        img = Image.open(path).convert("RGB")

        probs_list = []
        for tfm in tta_transforms_list:
            tensor = tfm(img).unsqueeze(0).to(device)
            with autocast(enabled=CONFIG["use_amp"]):
                logit = model(tensor)
            prob = F.softmax(logit, dim=1).squeeze(0).cpu().numpy()
            probs_list.append(prob)

        all_avg_probs.append(np.mean(probs_list, axis=0))
        all_true.append(label)

    return np.array(all_avg_probs), np.array(all_true)


# ─────────────────────────────────────────────
# PLOTTING FUNCTIONS
# ─────────────────────────────────────────────
def plot_training_curves(history, save_dir):
    """Plot accuracy and loss curves."""
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))
    fig.suptitle("Training Curves – Papaya ViT", fontsize=15, fontweight='bold')

    epochs = range(1, len(history['train_loss']) + 1)

    # Loss
    ax = axes[0]
    ax.plot(epochs, history['train_loss'], 'b-o', ms=4, label='Train Loss')
    ax.plot(epochs, history['val_loss'],   'r-o', ms=4, label='Val Loss')
    ax.set_xlabel("Epoch"); ax.set_ylabel("Loss")
    ax.set_title("Loss vs Epoch")
    ax.legend(); ax.grid(True, alpha=0.4)
    if history.get('best_epoch'):
        ax.axvline(history['best_epoch'], ls='--', color='gray', label='Best Model')
        ax.legend()

    # Accuracy
    ax = axes[1]
    ax.plot(epochs, history['train_acc'], 'b-o', ms=4, label='Train Acc')
    ax.plot(epochs, history['val_acc'],   'r-o', ms=4, label='Val Acc')
    ax.set_xlabel("Epoch"); ax.set_ylabel("Accuracy (%)")
    ax.set_title("Accuracy vs Epoch")
    ax.legend(); ax.grid(True, alpha=0.4)

    plt.tight_layout()
    path = os.path.join(save_dir, "training_curves.png")
    plt.savefig(path, dpi=150, bbox_inches='tight')
    plt.close()
    print(f"Saved: {path}")


def plot_lr_curve(history, save_dir):
    fig, ax = plt.subplots(figsize=(8, 4))
    ax.plot(range(1, len(history['lr']) + 1), history['lr'], 'g-')
    ax.set_xlabel("Epoch"); ax.set_ylabel("Learning Rate")
    ax.set_title("Learning Rate Schedule"); ax.grid(True, alpha=0.4)
    ax.set_yscale('log')
    path = os.path.join(save_dir, "lr_schedule.png")
    plt.savefig(path, dpi=150, bbox_inches='tight')
    plt.close()
    print(f"Saved: {path}")


def plot_confusion_matrix(y_true, y_pred, class_names, save_dir, title="Confusion Matrix"):
    cm = confusion_matrix(y_true, y_pred)
    cm_norm = cm.astype(float) / cm.sum(axis=1, keepdims=True)

    fig, axes = plt.subplots(1, 2, figsize=(14, 5))
    for ax, data, fmt, t in zip(axes,
                                 [cm, cm_norm],
                                 ['d', '.2f'],
                                 ["Count", "Normalized"]):
        sns.heatmap(data, annot=True, fmt=fmt, cmap='Blues',
                    xticklabels=class_names, yticklabels=class_names,
                    ax=ax, linewidths=0.5)
        ax.set_title(f"{title} ({t})")
        ax.set_xlabel("Predicted"); ax.set_ylabel("True")

    plt.tight_layout()
    path = os.path.join(save_dir, "confusion_matrix.png")
    plt.savefig(path, dpi=150, bbox_inches='tight')
    plt.close()
    print(f"Saved: {path}")


def plot_roc_curves(y_true, y_probs, class_names, save_dir):
    n_classes = len(class_names)
    y_bin = label_binarize(y_true, classes=list(range(n_classes)))

    fig, ax = plt.subplots(figsize=(9, 7))
    colors = plt.cm.Set1(np.linspace(0, 1, n_classes))

    for i, (name, col) in enumerate(zip(class_names, colors)):
        fpr, tpr, _ = roc_curve(y_bin[:, i], y_probs[:, i])
        auc = roc_auc_score(y_bin[:, i], y_probs[:, i])
        ax.plot(fpr, tpr, color=col, lw=2, label=f"{name} (AUC={auc:.3f})")

    # Macro AUC
    macro_auc = roc_auc_score(y_bin, y_probs, average='macro')
    ax.plot([0,1],[0,1],'k--', lw=1)
    ax.set_xlabel("False Positive Rate"); ax.set_ylabel("True Positive Rate")
    ax.set_title(f"ROC Curves (Macro AUC = {macro_auc:.3f})")
    ax.legend(loc='lower right'); ax.grid(True, alpha=0.3)
    path = os.path.join(save_dir, "roc_curves.png")
    plt.savefig(path, dpi=150, bbox_inches='tight')
    plt.close()
    print(f"Saved: {path}")


def plot_precision_recall(y_true, y_probs, class_names, save_dir):
    n_classes = len(class_names)
    y_bin = label_binarize(y_true, classes=list(range(n_classes)))

    fig, ax = plt.subplots(figsize=(9, 7))
    colors = plt.cm.Set1(np.linspace(0, 1, n_classes))

    for i, (name, col) in enumerate(zip(class_names, colors)):
        prec, rec, _ = precision_recall_curve(y_bin[:, i], y_probs[:, i])
        ap = average_precision_score(y_bin[:, i], y_probs[:, i])
        ax.plot(rec, prec, color=col, lw=2, label=f"{name} (AP={ap:.3f})")

    ax.set_xlabel("Recall"); ax.set_ylabel("Precision")
    ax.set_title("Precision-Recall Curves")
    ax.legend(); ax.grid(True, alpha=0.3)
    path = os.path.join(save_dir, "precision_recall.png")
    plt.savefig(path, dpi=150, bbox_inches='tight')
    plt.close()
    print(f"Saved: {path}")


def plot_class_metrics(y_true, y_pred, class_names, save_dir):
    report = classification_report(y_true, y_pred,
                                   target_names=class_names, output_dict=True)
    metrics = ['precision', 'recall', 'f1-score']
    x = np.arange(len(class_names))
    width = 0.25

    fig, ax = plt.subplots(figsize=(10, 5))
    for i, m in enumerate(metrics):
        vals = [report[c][m] for c in class_names]
        ax.bar(x + i*width, vals, width, label=m.title())

    ax.set_xticks(x + width)
    ax.set_xticklabels(class_names)
    ax.set_ylim(0, 1.1); ax.set_ylabel("Score")
    ax.set_title("Per-Class Precision / Recall / F1")
    ax.legend(); ax.grid(True, alpha=0.3, axis='y')

    path = os.path.join(save_dir, "class_metrics.png")
    plt.savefig(path, dpi=150, bbox_inches='tight')
    plt.close()
    print(f"Saved: {path}")


def plot_probability_distribution(y_true, y_probs, class_names, save_dir):
    n = len(class_names)
    fig, axes = plt.subplots(1, n, figsize=(4*n, 4), sharey=False)
    fig.suptitle("Predicted Probability Distributions per True Class", fontsize=13)

    for i, (ax, name) in enumerate(zip(axes, class_names)):
        mask = y_true == i
        if mask.sum() == 0:
            continue
        for j, cname in enumerate(class_names):
            ax.hist(y_probs[mask, j], bins=15, alpha=0.6, label=cname)
        ax.set_title(f"True: {name}"); ax.set_xlabel("Probability")
        ax.legend(fontsize=7)

    plt.tight_layout()
    path = os.path.join(save_dir, "prob_distributions.png")
    plt.savefig(path, dpi=150, bbox_inches='tight')
    plt.close()
    print(f"Saved: {path}")


def plot_summary_dashboard(history, y_true, y_pred, y_probs, class_names, save_dir):
    """Single large dashboard summarising training."""
    fig = plt.figure(figsize=(20, 12))
    gs  = gridspec.GridSpec(2, 4, figure=fig, hspace=0.45, wspace=0.35)

    # 1. Loss
    ax1 = fig.add_subplot(gs[0, 0])
    ep = range(1, len(history['train_loss'])+1)
    ax1.plot(ep, history['train_loss'], label='Train'); ax1.plot(ep, history['val_loss'], label='Val')
    ax1.set_title("Loss"); ax1.set_xlabel("Epoch"); ax1.legend(); ax1.grid(alpha=0.3)

    # 2. Accuracy
    ax2 = fig.add_subplot(gs[0, 1])
    ax2.plot(ep, history['train_acc'], label='Train'); ax2.plot(ep, history['val_acc'], label='Val')
    ax2.set_title("Accuracy (%)"); ax2.set_xlabel("Epoch"); ax2.legend(); ax2.grid(alpha=0.3)

    # 3. LR
    ax3 = fig.add_subplot(gs[0, 2])
    ax3.plot(ep, history['lr'], 'g-'); ax3.set_yscale('log')
    ax3.set_title("LR Schedule"); ax3.set_xlabel("Epoch"); ax3.grid(alpha=0.3)

    # 4. Confusion matrix
    ax4 = fig.add_subplot(gs[0, 3])
    cm = confusion_matrix(y_true, y_pred)
    cm_n = cm.astype(float) / cm.sum(axis=1, keepdims=True)
    sns.heatmap(cm_n, annot=True, fmt='.2f', cmap='Blues',
                xticklabels=class_names, yticklabels=class_names, ax=ax4, cbar=False)
    ax4.set_title("Norm. Confusion"); ax4.set_xlabel("Pred"); ax4.set_ylabel("True")

    # 5-8. ROC per class
    n_cls = len(class_names)
    y_bin = label_binarize(y_true, classes=list(range(n_cls)))
    colors = ['blue','orange','green','red']
    for i in range(n_cls):
        ax = fig.add_subplot(gs[1, i])
        fpr, tpr, _ = roc_curve(y_bin[:, i], y_probs[:, i])
        auc = roc_auc_score(y_bin[:, i], y_probs[:, i])
        ax.plot(fpr, tpr, color=colors[i], lw=2)
        ax.plot([0,1],[0,1],'k--', lw=1)
        ax.fill_between(fpr, tpr, alpha=0.1, color=colors[i])
        ax.set_title(f"ROC {class_names[i]}\nAUC={auc:.3f}")
        ax.set_xlabel("FPR"); ax.set_ylabel("TPR")
        ax.grid(alpha=0.3)

    fig.suptitle("Papaya Growth Stage – ViT Training Dashboard", fontsize=16, fontweight='bold')
    path = os.path.join(save_dir, "dashboard.png")
    plt.savefig(path, dpi=150, bbox_inches='tight')
    plt.close()
    print(f"Saved: {path}")


# ─────────────────────────────────────────────
# MAIN TRAINING FUNCTION
# ─────────────────────────────────────────────
def train():
    print("\n" + "="*60)
    print(" PAPAYA GROWTH STAGE CLASSIFICATION — ViT TRAINING")
    print("="*60)

    # 1. Load data
    train_loader, val_loader, class_to_idx = load_datasets(
        CONFIG["data_dir"], CONFIG["val_split"]
    )
    class_names = [CONFIG["class_names"][c] for c in CONFIG["classes"]]

    # 2. Build model
    model = PapayaViT(
        CONFIG["model_name"],
        CONFIG["num_classes"],
        CONFIG["pretrained"]
    ).to(device)

    total_params = sum(p.numel() for p in model.parameters())
    trainable    = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"\nModel: {CONFIG['model_name']} | Total params: {total_params:,} | "
          f"Trainable: {trainable:,}")

    # 3. Loss, optimizer, scheduler, scaler
    criterion = nn.CrossEntropyLoss(label_smoothing=CONFIG["label_smoothing"])

    # Differential learning rates: lower LR for backbone
    backbone_params = list(model.backbone.parameters())
    head_params     = list(model.head.parameters()) + \
                      list(model.aux_head.parameters()) + \
                      list(model.attn_pool.parameters())

    optimizer = optim.AdamW([
        {'params': backbone_params, 'lr': CONFIG["lr"] * 0.1},
        {'params': head_params,     'lr': CONFIG["lr"]},
    ], weight_decay=CONFIG["weight_decay"])

    total_steps = CONFIG["epochs"] * len(train_loader)
    scheduler   = OneCycleLR(
        optimizer,
        max_lr=[CONFIG["lr"] * 0.1, CONFIG["lr"]],
        total_steps=total_steps,
        pct_start=CONFIG["warmup_epochs"] / CONFIG["epochs"],
        div_factor=25,
        final_div_factor=1e4,
    )

    scaler = GradScaler(enabled=CONFIG["use_amp"])

    # 4. Training loop
    history = {k: [] for k in ['train_loss','train_acc','val_loss','val_acc','lr']}
    best_val_acc = 0.
    best_state   = None
    patience_ctr = 0

    for epoch in range(1, CONFIG["epochs"] + 1):
        # Unfreeze backbone after freeze_epochs
        if epoch == CONFIG["freeze_epochs"] + 1:
            model.unfreeze_backbone()
            print(f"\n[Epoch {epoch}] Backbone unfrozen for fine-tuning.")

        t0 = time.time()
        tr_loss, tr_acc = train_one_epoch(model, train_loader, optimizer,
                                          criterion, scaler, epoch)
        scheduler.step()
        vl_loss, vl_acc, v_preds, v_labels, v_probs = validate(model, val_loader, criterion)

        cur_lr = optimizer.param_groups[1]['lr']
        history['train_loss'].append(tr_loss)
        history['train_acc'].append(tr_acc)
        history['val_loss'].append(vl_loss)
        history['val_acc'].append(vl_acc)
        history['lr'].append(cur_lr)

        elapsed = time.time() - t0
        print(f"[{epoch:03d}/{CONFIG['epochs']}] "
              f"Train Loss={tr_loss:.4f} Acc={tr_acc:.1f}% | "
              f"Val Loss={vl_loss:.4f} Acc={vl_acc:.1f}% | "
              f"LR={cur_lr:.6f} | {elapsed:.1f}s")

        # Save best
        if vl_acc > best_val_acc:
            best_val_acc = vl_acc
            history['best_epoch'] = epoch
            best_state   = copy.deepcopy(model.state_dict())
            best_preds, best_labels, best_probs = v_preds, v_labels, v_probs
            torch.save({
                'epoch': epoch,
                'model_state': best_state,
                'optimizer_state': optimizer.state_dict(),
                'val_acc': best_val_acc,
                'class_to_idx': class_to_idx,
                'config': CONFIG,
            }, CONFIG["model_save_path"])
            print(f"  ✅ Best model saved (val_acc={best_val_acc:.2f}%)")
            patience_ctr = 0
        else:
            patience_ctr += 1
            if patience_ctr >= CONFIG["early_stopping_patience"]:
                print(f"\nEarly stopping at epoch {epoch}.")
                break

        # Checkpoint
        torch.save({
            'epoch': epoch,
            'model_state': model.state_dict(),
            'optimizer_state': optimizer.state_dict(),
            'scheduler_state': scheduler.state_dict(),
            'history': history,
        }, CONFIG["checkpoint_path"])

    # 5. TTA inference on best model
    print("\nRunning Test-Time Augmentation on validation set...")
    model.load_state_dict(best_state)
    if CONFIG["use_tta"]:
        try:
            tta_probs, tta_labels = tta_predict(model, val_loader, tta_transforms)
            tta_preds = tta_probs.argmax(axis=1)
            tta_acc   = 100. * (tta_preds == tta_labels).mean()
            print(f"TTA Accuracy: {tta_acc:.2f}%  (vs standard {best_val_acc:.2f}%)")
            final_preds, final_labels, final_probs = tta_preds, tta_labels, tta_probs
        except Exception as e:
            print(f"TTA failed ({e}), using standard predictions.")
            final_preds, final_labels, final_probs = best_preds, best_labels, best_probs
    else:
        final_preds, final_labels, final_probs = best_preds, best_labels, best_probs

    # 6. Final report
    print("\n" + "="*60)
    print("CLASSIFICATION REPORT")
    print("="*60)
    print(classification_report(final_labels, final_preds, target_names=class_names))

    # 7. Save all plots
    print("\nGenerating plots...")
    plot_training_curves(history, CONFIG["plots_dir"])
    plot_lr_curve(history, CONFIG["plots_dir"])
    plot_confusion_matrix(final_labels, final_preds, class_names, CONFIG["plots_dir"])
    plot_roc_curves(final_labels, final_probs, class_names, CONFIG["plots_dir"])
    plot_precision_recall(final_labels, final_probs, class_names, CONFIG["plots_dir"])
    plot_class_metrics(final_labels, final_preds, class_names, CONFIG["plots_dir"])
    plot_probability_distribution(final_labels, final_probs, class_names, CONFIG["plots_dir"])
    plot_summary_dashboard(history, final_labels, final_preds, final_probs,
                           class_names, CONFIG["plots_dir"])

    # 8. Save history
    with open(os.path.join(CONFIG["output_dir"], "training_history.json"), 'w') as f:
        json.dump(history, f, indent=2)

    print(f"\n{'='*60}")
    print(f"Training complete! Best Val Acc: {best_val_acc:.2f}%")
    print(f"Model saved to: {CONFIG['model_save_path']}")
    print(f"Plots saved to: {CONFIG['plots_dir']}/")
    print("="*60)


# ─────────────────────────────────────────────
# INFERENCE HELPER
# ─────────────────────────────────────────────
@torch.no_grad()
def predict_image(image_path, model_path=None):
    """Load the saved model and predict a single image."""
    if model_path is None:
        model_path = CONFIG["model_save_path"]

    ckpt  = torch.load(model_path, map_location=device)
    model = PapayaViT(CONFIG["model_name"], CONFIG["num_classes"], pretrained=False).to(device)
    model.load_state_dict(ckpt['model_state'])
    model.eval()

    from PIL import Image
    img = Image.open(image_path).convert("RGB")

    probs_list = []
    for tfm in tta_transforms:
        tensor = tfm(img).unsqueeze(0).to(device)
        logit  = model(tensor)
        prob   = F.softmax(logit, dim=1).squeeze(0).cpu().numpy()
        probs_list.append(prob)

    avg_probs = np.mean(probs_list, axis=0)
    pred_idx  = avg_probs.argmax()
    pred_class = CONFIG["classes"][pred_idx]
    confidence = avg_probs[pred_idx]

    print(f"Prediction: Stage {pred_class.upper()} — "
          f"{CONFIG['class_names'][pred_class]}  "
          f"(confidence: {confidence*100:.1f}%)")
    for i, (cls, p) in enumerate(zip(CONFIG["classes"], avg_probs)):
        print(f"  {CONFIG['class_names'][cls]}: {p*100:.1f}%")
    return pred_class, avg_probs


# ─────────────────────────────────────────────
# ENTRY POINT
# ─────────────────────────────────────────────
if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Papaya ViT Trainer")
    parser.add_argument('--mode', choices=['train','predict'], default='train')
    parser.add_argument('--image', type=str, default=None,
                        help="Image path for prediction mode")
    parser.add_argument('--model', type=str, default=None,
                        help="Model checkpoint for prediction mode")
    parser.add_argument('--data_dir', type=str, default=CONFIG["data_dir"])
    parser.add_argument('--epochs',   type=int, default=CONFIG["epochs"])
    parser.add_argument('--batch_size', type=int, default=CONFIG["batch_size"])
    args = parser.parse_args()

    CONFIG["data_dir"]   = args.data_dir
    CONFIG["epochs"]     = args.epochs
    CONFIG["batch_size"] = args.batch_size

    if args.mode == 'train':
        train()
    else:
        if args.image is None:
            print("Provide --image for predict mode.")
        else:
            predict_image(args.image, args.model)