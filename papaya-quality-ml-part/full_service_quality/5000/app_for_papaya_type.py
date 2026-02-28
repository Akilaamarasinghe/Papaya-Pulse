import torch
import torch.nn as nn
import torchvision.transforms as transforms
from torchvision import models
from flask import Flask, request, jsonify
from PIL import Image
import numpy as np
from captum.attr import LayerGradCam
import io

from check_papaya import predict_pipeline

app = Flask(__name__)

# -------------------------
# Load Model
# -------------------------
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

model = models.convnext_tiny(weights="DEFAULT")
model.classifier[2] = nn.Linear(model.classifier[2].in_features, 2)
model.load_state_dict(torch.load("papaya_image_models/papaya_model_best.pth", map_location=device))
model.eval()
model.to(device)

# GradCAM layer (ConvNeXt final feature block)
target_layer = model.features[-1]
cam = LayerGradCam(model, target_layer)

# -------------------------
# Preprocess
# -------------------------
tf = transforms.Compose([
    transforms.Resize((384, 384)),
    transforms.ToTensor(),
    transforms.Normalize([0.5]*3, [0.5]*3)
])

class_names = ["Type A", "Type B"]

# -------------------------
# Generate text explanation from attributions
# -------------------------
def make_text_explanation(attributions):
    # detach → move to CPU → convert to numpy
    att = attributions.detach().squeeze().cpu().numpy()

    # Normalize
    att = abs(att)
    score = att.mean()

    if score > 0.6:
        return "Model heavily focused on texture patterns, strong contrast zones, and spot density to decide the type."
    elif score > 0.3:
        return "Model looked at moderate texture variations, surface color gradients, and patch differences."
    else:
        return "Model prediction came from subtle texture cues and general shape patterns."

# -------------------------
# Predict endpoint
# -------------------------
@app.route("/predict-papaya-type", methods=["POST"])
def predict_papaya_type():
    if "image" not in request.files:
        return jsonify({"error": "image file missing"}), 400

    img_bytes = request.files["image"].read()
    img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    papaya_result = predict_pipeline(img)
    if papaya_result["is_papaya"] is False:
        return jsonify({
            "prediction": "Not a papaya",
            "confidence": papaya_result["not_papaya_prob"],
            "explanation": "The uploaded image was classified as not a papaya by the initial model."
        })

    img_tensor = tf(img).to(device)
    img_batch = img_tensor.unsqueeze(0)

    # Forward
    with torch.no_grad():
        outputs = model(img_batch)
        probs = torch.softmax(outputs, dim=1)
        conf, class_idx = torch.max(probs, dim=1)

    class_idx = int(class_idx.item())
    confidence = f"{round(float(conf.item())*100, 2)}%"

    # --------------------
    # XAI: Layer GradCAM attribution map
    # --------------------
    attributions = cam.attribute(img_batch, target=class_idx)

    explanation = make_text_explanation(attributions)

    return jsonify({
        "prediction": class_names[class_idx],
        "confidence": confidence,
        "explanation": explanation
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
