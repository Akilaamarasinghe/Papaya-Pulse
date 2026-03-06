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

TRANSLATIONS_SI = {
    "Type A": "ශ්‍රේණිය A",
    "Type B": "ශ්‍රේණිය B",
    "Not a papaya": "පැපොල් ගෙඩියක් නොවේ",
    "heavy_texture": "AI ආදර්ශකය ව්‍යුහ රටාව, ශක්තිමත් වෙනස් ප්‍රදේශ සහ ලප ඝනත්වය දෙස දැඩිව අවධානය යොමු කළේය.",
    "moderate_texture": "AI ආදර්ශකය මධ්‍යස්ථ ව්‍යුහ වෙනස්කම්, මතුපිට වර්ණ අනුක්‍රමය සහ ලප වෙනස්කම් දෙස බැලීය.",
    "subtle_texture": "AI ආදර්ශකය සියුම් ව්‍යුහ ලකුණු සහ සාමාන්‍ය හැඩ රටා භාවිතා කළේය.",
    "not_papaya_msg": "ආරම්භක ආදර්ශකය විසින් ඡායාරූපය පැපොල් ගෙඩියක් ලෙස හඳුනා නොගැනිනි.",
}

# -------------------------
# Generate text explanation from attributions
# -------------------------
def make_text_explanation(attributions, lang='en'):
    # detach → move to CPU → convert to numpy
    att = attributions.detach().squeeze().cpu().numpy()

    # Normalize
    att = abs(att)
    score = att.mean()

    if score > 0.6:
        key = "heavy_texture"
        en_text = "Model heavily focused on texture patterns, strong contrast zones, and spot density to decide the type."
    elif score > 0.3:
        key = "moderate_texture"
        en_text = "Model looked at moderate texture variations, surface color gradients, and patch differences."
    else:
        key = "subtle_texture"
        en_text = "Model prediction came from subtle texture cues and general shape patterns."

    if lang == 'si':
        return TRANSLATIONS_SI[key]
    return en_text

# -------------------------
# Predict endpoint
# -------------------------
@app.route("/predict-papaya-type", methods=["POST"])
def predict_papaya_type():
    if "image" not in request.files:
        return jsonify({"error": "image file missing"}), 400

    lang = request.args.get('lang', 'en')

    img_bytes = request.files["image"].read()
    img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    papaya_result = predict_pipeline(img)
    if papaya_result["is_papaya"] is False:
        not_papaya_label = TRANSLATIONS_SI["Not a papaya"] if lang == 'si' else "Not a papaya"
        not_papaya_msg = TRANSLATIONS_SI["not_papaya_msg"] if lang == 'si' else "The uploaded image was classified as not a papaya by the initial model."
        return jsonify({
            "prediction": not_papaya_label,
            "confidence": papaya_result["not_papaya_prob"],
            "explanation": not_papaya_msg
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

    explanation = make_text_explanation(attributions, lang=lang)

    predicted_label = class_names[class_idx]
    if lang == 'si':
        predicted_label = TRANSLATIONS_SI.get(predicted_label, predicted_label)

    return jsonify({
        "prediction": predicted_label,
        "confidence": confidence,
        "explanation": explanation
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
