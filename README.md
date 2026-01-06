# 🌱 Papaya Pulse  
### *AI-Driven Mobile Assistant for Papaya Cultivation in Sri Lanka*

> 📱 Intelligent decision support for **smallholder papaya farmers and customers** using **AI, computer vision, explainable ML, and weather-aware analytics**.

---

## ✨ Project Snapshot

| Category | Details |
|--------|--------|
| **User Roles** | 👨‍🌾 Farmer · 🛒 Customer |
| **Platforms** | 📱 React Native (Expo) · 🌐 Node.js / Express · 🧠 Python ML |
| **AI / ML** | ViT image models · Color-based CNNs · SHAP (Explainable AI) |
| **External Data** | 🌦 Weather Forecast API · 📊 Market Price Feeds |
| **Storage** | 🗄 MongoDB (users & logs) · 🖼 Image storage (configurable) |

---



## 🚶 User Journeys

### 👨‍🌾 Farmer – Papaya Quality Grading
**Login → Quality Menu → Select Flow**

#### 🍈 Best Quality Papaya
- Farmer ID  
- District (Galle / Matara / Hambantota)  
- Variety (Red Lady / Tenim / Solo)  
- Maturity stage  
- Days after harvest  
- Papaya image  

**Outputs**
- Grade (A / B / C)  
- Probability score  
- Expert farming suggestions  

---

#### 🏭 Factory Outlet Papaya
- Upload damaged-area image  
- Factory grade classification  
- Taste prediction (temperature-based)  
- Recommendations  

---

### 🍃 Leaf Disease Detection
- Papaya / Non-papaya validation  
- Disease identification (Anthracnose, Curl, Mite, Ringspot)  
- Severity (Mild / Moderate / Severe)  
- Sri Lanka–compliant treatment & prevention  

⚠️ Invalid image message:
> “This does not look like a papaya leaf.”

---

### 🌱 Growth Stage & Harvest Prediction
- Plant image → Stage A / B / C / D  
- Action guidance  
- Harvest prediction using weather & ML  

---

### 🛒 Market Price Prediction (Customer)
- Seller price per kg  
- Optional papaya image  
- Fair price range  
- Label: Underpriced / Fair / Overpriced  
- Buying recommendation

<img width="1888" height="682" alt="Untitled design" src="https://github.com/user-attachments/assets/44ee6b37-7326-42ab-a895-abaf957317a7" />


---

## 🗂 Repository Structure

```
Papaya-Pulse/
├── backend/
│   └── ml_service/
├── frontend/
├── papaya-harvest-prediction-ml-part/
├── papaya-leaf-disease-ml-part/
└── papaya-quality-ml-part/
```

---

## 🛠 Tech Stack

**Frontend:** React Native (Expo), TypeScript  
**Backend:** Node.js, Express, MongoDB, Firebase  
**AI / ML:** ViT, CNN, SHAP, Weather-based regression  
**APIs:** Open-Meteo, Market price feeds  

---

##👨‍🎓 Contributors

🎓 SLIIT – 4th Year IT Undergraduate Research Team
📌 Project: Papaya Pulse

👥 Team Members

Member 1 Akila Amarasinghe 
🔗 GitHub: https://github.com/username1

Member 2 Udan jayasekara 
🔗 GitHub: https://github.com/username2

Member 3 Athsara Weththasinghe 
🔗 GitHub: https://github.com/username3

Member 4 Sachini Tharindi 
🔗 GitHub: https://github.com/username4

---

🔗 GitHub Repository  
https://github.com/Akilaamarasinghe/Papaya-Pulse


<img width="1408" height="768" alt="Architecture Diagram" src="https://github.com/user-attachments/assets/95e4587c-d1b6-412b-8424-5cc72ebb3b00" />

<img width="1408" height="768" alt="SystemOverviewDiagram" src="https://github.com/user-attachments/assets/fd4c46d5-489a-498b-92e0-2b5240565fe0" />
