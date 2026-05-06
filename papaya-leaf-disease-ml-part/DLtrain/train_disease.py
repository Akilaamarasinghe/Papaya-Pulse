import torch
import torch.nn as nn
from torchvision import datasets, transforms, models
from torch.utils.data import DataLoader
import os

DATA_DIR = "dataset/disease"
SAVE_PATH = "models/disease/disease_classifier.pth"
BATCH_SIZE = 16
EPOCHS = 20
LR = 0.001
IMG_SIZE = 224

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

transform = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.RandomHorizontalFlip(),
    transforms.RandomRotation(15),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406],
                         [0.229, 0.224, 0.225])
])

dataset = datasets.ImageFolder(DATA_DIR, transform=transform)
loader = DataLoader(dataset, batch_size=BATCH_SIZE, shuffle=True)

num_classes = len(dataset.classes)
print("Classes:", dataset.classes)

model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
model.fc = nn.Linear(model.fc.in_features, num_classes)
model = model.to(device)

criterion = nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(model.parameters(), lr=LR)

for epoch in range(EPOCHS):
    model.train()
    total_loss = 0
    correct = 0

    for images, labels in loader:
        images, labels = images.to(device), labels.to(device)

        optimizer.zero_grad()
        outputs = model(images)

        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()

        total_loss += loss.item()
        correct += (outputs.argmax(1) == labels).sum().item()

    acc = correct / len(dataset)
    print(f"Epoch {epoch+1}/{EPOCHS} | Loss: {total_loss:.4f} | Acc: {acc:.4f}")

os.makedirs(os.path.dirname(SAVE_PATH), exist_ok=True)

torch.save({
    "model_state_dict": model.state_dict(),
    "classes": dataset.classes
}, SAVE_PATH)

print("Saved:", SAVE_PATH)