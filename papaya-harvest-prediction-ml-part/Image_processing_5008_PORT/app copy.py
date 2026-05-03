import io, os, time
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import transforms
from PIL import Image
from flask import Flask, request, jsonify
import timm

# ─────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────
PAPAYA_MODEL_PATH = "outputsForPapayaVsNonPapaya/papaya_vs_non_papaya_vit_best.pth"
GRADE_MODEL_PATH  = "outputs/papaya_vit_best.pth"

PAPAYA_CLASSES = ["non_papaya", "papaya"]
GRADE_CLASSES  = ["a", "b", "c", "d"]
GRADE_NAMES    = ["Seedling", "Juvenile", "Pre-fruiting", "Fruiting"]

IMG_SIZE = 224
MEAN = [0.485, 0.456, 0.406]
STD  = [0.229, 0.224, 0.225]

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# ─────────────────────────────────────────────
# TRANSFORMS (UNCHANGED)
# ─────────────────────────────────────────────
val_tf = transforms.Compose([
    transforms.Resize(int(IMG_SIZE * 1.14)),
    transforms.CenterCrop(IMG_SIZE),
    transforms.ToTensor(),
    transforms.Normalize(MEAN, STD),
])

tta_tfs = [
    val_tf,
    transforms.Compose([
        transforms.Resize(int(IMG_SIZE * 1.14)),
        transforms.CenterCrop(IMG_SIZE),
        transforms.RandomHorizontalFlip(p=1.0),
        transforms.ToTensor(),
        transforms.Normalize(MEAN, STD),
    ]),
    transforms.Compose([
        transforms.Resize(int(IMG_SIZE * 1.3)),
        transforms.CenterCrop(IMG_SIZE),
        transforms.ToTensor(),
        transforms.Normalize(MEAN, STD),
    ]),
    transforms.Compose([
        transforms.Resize(int(IMG_SIZE * 0.9)),
        transforms.Pad(int(IMG_SIZE * 0.07)),
        transforms.CenterCrop(IMG_SIZE),
        transforms.ToTensor(),
        transforms.Normalize(MEAN, STD),
    ]),
]

# ─────────────────────────────────────────────
# MODEL ARCH (UNCHANGED)
# ─────────────────────────────────────────────
class AttentionPool(nn.Module):
    def __init__(self, dim, num_heads=8):
        super().__init__()
        self.attn = nn.MultiheadAttention(dim, num_heads, batch_first=True)
        self.query = nn.Parameter(torch.randn(1, 1, dim))
        self.norm = nn.LayerNorm(dim)

    def forward(self, x):
        q = self.query.expand(x.size(0), -1, -1)
        out, _ = self.attn(q, x, x)
        return self.norm(out.squeeze(1))


class PapayaViT(nn.Module):
    def __init__(self, num_classes):
        super().__init__()
        self.backbone = timm.create_model(
            "vit_base_patch16_224",
            pretrained=False,
            num_classes=0,
            global_pool=""
        )

        dim = self.backbone.embed_dim

        self.attn_pool = AttentionPool(dim)

        self.head = nn.Sequential(
            nn.Linear(dim, 512),
            nn.GELU(),
            nn.Dropout(0.3),
            nn.Linear(512, 256),
            nn.GELU(),
            nn.Dropout(0.2),
            nn.Linear(256, num_classes),
        )

        # 🔥 REQUIRED — was in training checkpoint
        self.aux_head = nn.Sequential(
            nn.LayerNorm(dim),
            nn.Linear(dim, num_classes),
        )

    def forward(self, x):
        feats = self.backbone.forward_features(x)
        pooled = self.attn_pool(feats[:, 1:])
        return self.head(pooled)

# ─────────────────────────────────────────────
# LOAD MODEL
# ─────────────────────────────────────────────
def load_model(path, num_classes):
    ckpt = torch.load(path, map_location=device, weights_only=False)
    state = ckpt.get("model_state") or ckpt.get("state_dict") or ckpt
    model = PapayaViT(num_classes)
    model.load_state_dict(state, strict=True)
    return model.to(device).eval()

papaya_model = load_model(PAPAYA_MODEL_PATH, 2)
grade_model  = load_model(GRADE_MODEL_PATH, 4)

# ─────────────────────────────────────────────
# INFERENCE
# ─────────────────────────────────────────────
@torch.no_grad()
def infer(model, img, classes, use_tta=True):
    if use_tta:
        probs = np.mean([
            F.softmax(model(tf(img).unsqueeze(0).to(device)), dim=1)
              .squeeze(0).cpu().numpy()
            for tf in tta_tfs
        ], axis=0)
    else:
        probs = F.softmax(
            model(val_tf(img).unsqueeze(0).to(device)),
            dim=1
        ).squeeze(0).cpu().numpy()

    idx = int(probs.argmax())
    return idx, probs

# ─────────────────────────────────────────────
# FLASK
# ─────────────────────────────────────────────
app = Flask(__name__)

@app.post("/predict")
def predict():
    if "file" not in request.files:
        return jsonify({"error": "Image required"}), 400

    img = Image.open(io.BytesIO(request.files["file"].read())).convert("RGB")
    use_tta = request.form.get("tta", "true").lower() not in ("false", "0", "no")

    # ─────────────────────────────
    # STEP 1 — PAPAYA VALIDATION
    # ─────────────────────────────
    idx, probs = infer(papaya_model, img, PAPAYA_CLASSES, use_tta)

    papaya_prob = float(probs[1])  # Probability for "papaya" class
    non_papaya_prob = float(probs[0])  # Probability for "non_papaya" class
    
    # If papaya probability >= 80%, classify as papaya, otherwise non_papaya
    is_papaya_pred = papaya_prob >= 0.80
    passed_threshold = is_papaya_pred
    
    predicted_class = "papaya" if is_papaya_pred else "non_papaya"
    confidence = papaya_prob if is_papaya_pred else non_papaya_prob

    response = {
        "papaya_validation": {
            "predicted_class": predicted_class,
            "confidence": round(confidence * 100, 2),
            "threshold_required": 80.0,
            "passed_threshold": passed_threshold,
            "probabilities": {
                PAPAYA_CLASSES[i]: round(float(probs[i]) * 100, 2)
                for i in range(len(PAPAYA_CLASSES))
            }
        },
        "is_papaya": is_papaya_pred,
        "grade_prediction": None  # default
    }

    # ─────────────────────────────
    # STEP 2 — GRADE CHECK (only if ≥ 0.8)
    # ─────────────────────────────
    if passed_threshold:
        gidx, gprobs = infer(grade_model, img, GRADE_CLASSES, use_tta)

        response["grade_prediction"] = {
            "grade": GRADE_CLASSES[gidx],
            "grade_name": GRADE_NAMES[gidx],
            "confidence": round(float(gprobs[gidx]) * 100, 2),
            "probabilities": {
                GRADE_CLASSES[i]: round(float(gprobs[i]) * 100, 2)
                for i in range(len(GRADE_CLASSES))
            }
        }

    return jsonify(response), 200
# ─────────────────────────────────────────────
if __name__ == "__main__":
    print("Papaya Validation + Grade API running")
    app.run(host="0.0.0.0", port=5000)