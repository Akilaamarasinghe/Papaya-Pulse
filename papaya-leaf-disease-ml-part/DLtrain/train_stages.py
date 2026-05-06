import os
import torch
import matplotlib.pyplot as plt
from torchvision import datasets, transforms
from torch.utils.data import DataLoader
from transformers import ViTForImageClassification

BASE_DIR = "dataset/stages"
SAVE_DIR = "models/stages"

EPOCHS = 10
BATCH_SIZE = 16
LR = 2e-5
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

transform = transforms.Compose([
    transforms.Resize((224,224)),
    transforms.ToTensor(),
    transforms.Normalize([0.5]*3,[0.5]*3)
])

for disease in os.listdir(BASE_DIR):
    disease_path = os.path.join(BASE_DIR, disease)

    if not os.path.isdir(disease_path):
        continue

    print(f"\nTraining stage model for: {disease}")

    dataset = datasets.ImageFolder(disease_path, transform=transform)
    loader = DataLoader(dataset, batch_size=BATCH_SIZE, shuffle=True)

    classes = dataset.classes

    model = ViTForImageClassification.from_pretrained(
        "google/vit-base-patch16-224",
        num_labels=len(classes)
    ).to(DEVICE)

    optimizer = torch.optim.AdamW(model.parameters(), lr=LR)
    criterion = torch.nn.CrossEntropyLoss()

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
            correct += (outputs.argmax(1) == labels).sum().item()

        acc = correct / len(dataset)
        losses.append(total_loss)
        accs.append(acc)

        print(f"{disease} Epoch {epoch+1}: Loss={total_loss:.4f}, Acc={acc:.4f}")

    save_path = os.path.join(SAVE_DIR, f"{disease}_stage.pth")

    torch.save({
        "state_dict": model.state_dict(),
        "classes": classes
    }, save_path)

    plt.plot(accs, label="Accuracy")
    plt.plot(losses, label="Loss")
    plt.legend()
    plt.title(f"{disease} Stage Training")
    plt.savefig(f"{disease}_stage_training.png")
    plt.clf()