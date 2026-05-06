import os
import torch
import numpy as np
import matplotlib.pyplot as plt
from torchvision import datasets, transforms
from torch.utils.data import DataLoader
from transformers import ViTForImageClassification

# ---------------- CONFIG ----------------
DATA_DIR = "dataset/leaf"  # leaf / not_leaf folders
SAVE_PATH = "models/leaf/leaf_detector.pth"
EPOCHS = 10
BATCH_SIZE = 16
LR = 2e-5
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# ---------------- TRANSFORMS ----------------
transform = transforms.Compose([
    transforms.Resize((224,224)),
    transforms.ToTensor(),
    transforms.Normalize([0.5]*3,[0.5]*3)
])

# ---------------- DATA ----------------
dataset = datasets.ImageFolder(DATA_DIR, transform=transform)
loader = DataLoader(dataset, batch_size=BATCH_SIZE, shuffle=True)

classes = dataset.classes

# ---------------- MODEL ----------------
model = ViTForImageClassification.from_pretrained(
    "google/vit-base-patch16-224",
    num_labels=len(classes)
).to(DEVICE)

optimizer = torch.optim.AdamW(model.parameters(), lr=LR)
criterion = torch.nn.CrossEntropyLoss()

# ---------------- TRAIN ----------------
losses, accs = [], []

for epoch in range(EPOCHS):
    model.train()
    total_loss, correct = 0, 0

    for imgs, labels in loader:
        imgs, labels = imgs.to(DEVICE), labels.to(DEVICE)

        outputs = model(imgs).logits
        loss = criterion(outputs, labels)

        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

        total_loss += loss.item()
        preds = outputs.argmax(1)
        correct += (preds == labels).sum().item()

    acc = correct / len(dataset)
    losses.append(total_loss)
    accs.append(acc)

    print(f"Epoch {epoch+1}: Loss={total_loss:.4f}, Acc={acc:.4f}")

# ---------------- SAVE ----------------
torch.save({
    "state_dict": model.state_dict(),
    "classes": classes
}, SAVE_PATH)

# ---------------- PLOT ----------------
plt.plot(accs, label="Accuracy")
plt.plot(losses, label="Loss")
plt.legend()
plt.title("Leaf Model Training")
plt.savefig("leaf_training.png")
plt.show()