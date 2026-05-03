import torch
import numpy as np
from torchvision import transforms
from transformers import ViTForImageClassification
import torch.nn as nn
import torch.nn.functional as F
import warnings
warnings.filterwarnings("ignore")

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

class ViTWrapper(nn.Module):
    def __init__(self, model):
        super().__init__()
        self.model = model
    def forward(self, x):
        return self.model(x).logits

def load_vit_model(path):
    saved = torch.load(path, map_location=device)
    classes = saved["classes"]

    base_model = ViTForImageClassification.from_pretrained(
        "google/vit-base-patch16-224",
        num_labels=len(classes),
        ignore_mismatched_sizes=True
    ).to(device)

    base_model.load_state_dict(saved["state_dict"], strict=False)
    base_model.eval()
    return ViTWrapper(base_model), classes

papaya_model, papaya_classes = load_vit_model("papaya_image_models/papaya_detector.pth")

image_tf = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485,0.456,0.406],[0.229,0.224,0.225])
])

def predict_pipeline(img):
    tensor = image_tf(img).to(device)

    with torch.no_grad():
        out = papaya_model(tensor.unsqueeze(0))
        probs = F.softmax(out, dim=1)[0].cpu().numpy()

    papaya_prob = float(probs[papaya_classes.index("papaya")])
    not_papaya_prob = float(probs[papaya_classes.index("non_papaya")])

    is_papaya = papaya_prob >= 0.5

    result = {
        "is_papaya": is_papaya,
        "papaya_prob": f"{papaya_prob * 100:.2f}%",
        "not_papaya_prob": f"{not_papaya_prob * 100:.2f}%"
    }

    if not is_papaya:
        result["message"] = "Not a papaya"
    
    return result

