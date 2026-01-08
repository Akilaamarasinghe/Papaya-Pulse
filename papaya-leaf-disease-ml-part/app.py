import torch
import numpy as np
from flask import Flask, request, jsonify
from PIL import Image
from torchvision import transforms
from transformers import ViTForImageClassification
import torch.nn as nn
import torch.nn.functional as F
import warnings
warnings.filterwarnings("ignore") 

app = Flask(__name__)
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

leaf_model, leaf_classes = load_vit_model("models/leaf/leaf_detector.pth")
disease_model, disease_classes = load_vit_model("models/disease/disease_classifier.pth")

def load_stage_model(disease):
    saved = torch.load(f"models/stages/{disease}_stage.pth", map_location=device)
    classes = saved["classes"]

    base_model = ViTForImageClassification.from_pretrained(
        "google/vit-base-patch16-224",
        num_labels=len(classes),
        ignore_mismatched_sizes=True
    ).to(device)

    base_model.load_state_dict(saved["state_dict"], strict=False)
    base_model.eval()
    return ViTWrapper(base_model), classes

image_tf = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485,0.456,0.406],[0.229,0.224,0.225])
])

def predict_pipeline(img):
    tensor = image_tf(img).to(device)

    with torch.no_grad():
        out = leaf_model(tensor.unsqueeze(0))
        probs = F.softmax(out, dim=1)[0].cpu().numpy()

    leaf_prob = float(probs[leaf_classes.index("leaf")])
    not_leaf_prob = float(probs[leaf_classes.index("not_leaf")])

    is_leaf = leaf_prob >= 0.5

    result = {
        "is_leaf": is_leaf,
        "leaf_prob": f"{leaf_prob * 100:.2f}%",
        "not_leaf_prob": f"{not_leaf_prob * 100:.2f}%"
    }

    if not is_leaf:
        result["message"] = "Not a papaya leaf"
        return result

    with torch.no_grad():
        out = disease_model(tensor.unsqueeze(0))
        probs = F.softmax(out, dim=1)[0].cpu().numpy()

    disease_idx = int(np.argmax(probs))
    disease_name = disease_classes[disease_idx]

    result["disease"] = disease_name
    result["disease_prob"] = f"{float(probs[disease_idx]) * 100:.2f}%"

    stage_model, stage_classes = load_stage_model(disease_name)

    with torch.no_grad():
        out = stage_model(tensor.unsqueeze(0))
        probs = F.softmax(out, dim=1)[0].cpu().numpy()

    stage_idx = int(np.argmax(probs))
    stage_name = stage_classes[stage_idx]

    result["stage"] = stage_name
    result["stage_prob"] = f"{float(probs[stage_idx]) * 100:.2f}%"
    return result

@app.route("/predict", methods=["POST"])
def predict():
    if "image" not in request.files:
        return jsonify({"error": "Image missing"}), 400
    img = Image.open(request.files["image"].stream).convert("RGB")
    return jsonify(predict_pipeline(img))

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5005, debug=True)
