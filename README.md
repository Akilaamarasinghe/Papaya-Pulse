# Papaya Pulse

### AI-Driven Mobile Assistant for Papaya Cultivation in Sri Lanka

Papaya Pulse is a research-grade mobile application developed to support smallholder papaya farmers and consumers in the Southern Province of Sri Lanka. It combines computer vision, explainable machine learning, and real-time weather intelligence into a single bilingual (English / Sinhala) platform.

---

<img width="1888" height="682" alt="Untitled design" src="https://github.com/user-attachments/assets/44ee6b37-7326-42ab-a895-abaf957317a7" />

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Repository Structure](#3-repository-structure)
4. [Feature Modules](#4-feature-modules)
   - 4.1 [User Authentication and Roles](#41-user-authentication-and-roles)
   - 4.2 [Papaya Quality Assessment – Farmer](#42-papaya-quality-assessment--farmer)
   - 4.3 [Papaya Quality Assessment – Customer](#43-papaya-quality-assessment--customer)
   - 4.4 [Leaf Disease Detection](#44-leaf-disease-detection)
   - 4.5 [Growth Stage Detection](#45-growth-stage-detection)
   - 4.6 [Harvest Prediction](#46-harvest-prediction)
   - 4.7 [Market Price Prediction – Farmer](#47-market-price-prediction--farmer)
   - 4.8 [Market Price Analysis – Customer](#48-market-price-analysis--customer)
5. [ML Microservices Reference](#5-ml-microservices-reference)
6. [Backend API Reference](#6-backend-api-reference)
7. [Frontend Application](#7-frontend-application)
8. [Technology Stack](#8-technology-stack)
9. [Installation and Setup](#9-installation-and-setup)
10. [Environment Variables](#10-environment-variables)
11. [Contributors](#11-contributors)

---

## 1. Project Overview

| Attribute | Details |
|---|---|
| User Roles | Farmer, Customer |
| Supported Districts | Galle, Matara, Hambantota (Southern Province, Sri Lanka) |
| Supported Varieties | Red Lady, Tainung, Solo |
| Languages | English, Sinhala |
| Mobile Platform | Android and iOS via Expo (React Native) |
| Backend | Node.js / Express (REST API gateway) |
| ML Layer | Seven independent Python Flask microservices |
| Databases | MongoDB Atlas (user profiles, prediction logs), Firebase Auth (identity) |
| Weather Data | Open-Meteo API (real-time 7-day forecasts and historical rainfall) |
| Explainability | SHAP values across all ML prediction outputs |

The system covers the full papaya cultivation lifecycle — from seedling growth tracking through leaf disease diagnosis, harvest scheduling, quality grading, and market price assessment — all backed by trained machine learning models and localised agronomic knowledge.

---

## 2. System Architecture

<img width="1408" height="768" alt="Architecture Diagram" src="https://github.com/user-attachments/assets/95e4587c-d1b6-412b-8424-5cc72ebb3b00" />

<img width="1408" height="768" alt="SystemOverviewDiagram" src="https://github.com/user-attachments/assets/fd4c46d5-489a-498b-92e0-2b5240565fe0" />

The application follows a microservices architecture with four layers.

**Layer 1 – Mobile Client (React Native / Expo)**
The user-facing app communicates exclusively with the Node.js backend over HTTPS using Firebase JWT tokens for every request.

**Layer 2 – Backend API Gateway (Node.js / Express, Port 3000)**
Acts as a secure orchestrator. It validates every Firebase token, enforces role-based access, forwards image payloads to the correct ML microservice, logs predictions to MongoDB, and returns normalised responses to the client.

**Layer 3 – Python ML Microservices (Ports 5000–5009)**
Each feature module is an independent Flask service with its own trained models and dependencies. Services are called internally by the backend only; they are not publicly exposed.

**Layer 4 – External Services**
Open-Meteo API provides weather data. MongoDB Atlas stores persistent data. Firebase handles user authentication.

---

## 3. Repository Structure

```
Papaya-Pulse/
│
├── backend/                              # Node.js API gateway (Port 3000)
│   ├── server.js                         # Express app entry point
│   ├── config/
│   │   ├── db.js                         # MongoDB connection
│   │   └── firebaseAdmin.js              # Firebase Admin SDK setup
│   ├── middleware/
│   │   └── auth.js                       # Firebase JWT verification middleware
│   ├── models/
│   │   ├── User.js                       # Mongoose user schema
│   │   └── PredictionLog.js              # Mongoose prediction log schema
│   ├── routes/
│   │   ├── userRoutes.js                 # /api/users
│   │   ├── growthRoutes.js               # /api/growth
│   │   ├── qualityRoutes.js              # /api/quality
│   │   ├── marketRoutes.js               # /api/market
│   │   └── leafRoutes.js                 # /api/leaf
│   └── ml_service/                       # Embedded harvest ML service (Port 5009 fallback)
│       ├── app.py
│       ├── weather_pipeline.py
│       └── models/
│           ├── yield_model.pkl
│           ├── harvest_model.pkl
│           ├── scaler.pkl
│           ├── feature_names.pkl
│           ├── shap_yield.pkl
│           └── shap_harvest.pkl
│
├── frontend/                             # React Native / Expo client
│   ├── app/
│   │   ├── _layout.tsx                   # Root layout with providers
│   │   ├── index.tsx                     # Entry / splash redirect
│   │   ├── onboarding.tsx                # Onboarding screens
│   │   ├── login.tsx                     # Login screen
│   │   ├── signup.tsx                    # Registration screen
│   │   ├── (tabs)/                       # Bottom-tab navigator
│   │   │   ├── index.tsx                 # Home dashboard
│   │   │   ├── explore.tsx               # Feature explorer
│   │   │   ├── profile.tsx               # User profile
│   │   │   ├── settings.tsx              # Theme and language settings
│   │   │   └── about.tsx                 # About / credits
│   │   ├── growth/                       # Growth and Harvest module
│   │   │   ├── index.tsx
│   │   │   ├── stage-check.tsx
│   │   │   ├── stage-result.tsx
│   │   │   ├── harvest-form.tsx
│   │   │   └── harvest-result.tsx
│   │   ├── leaf/                         # Leaf disease module
│   │   │   ├── index.tsx
│   │   │   ├── scan.tsx
│   │   │   ├── result.tsx
│   │   │   └── history.tsx
│   │   ├── quality/                      # Quality assessment module
│   │   │   ├── index.tsx
│   │   │   ├── farmer-input.tsx
│   │   │   ├── farmer-result.tsx
│   │   │   ├── customer-input.tsx
│   │   │   └── customer-result.tsx
│   │   └── market/                       # Market price module
│   │       ├── index.tsx
│   │       ├── predict-form.tsx
│   │       ├── result.tsx
│   │       ├── customer-predict.tsx
│   │       └── customer-result.tsx
│   ├── components/
│   │   ├── shared/                       # ScreenContainer, Card, PrimaryButton, LabeledInput
│   │   └── ui/                           # Themed UI primitives
│   ├── config/
│   │   ├── api.ts                        # Axios instance with JWT interceptor
│   │   └── firebase.ts                   # Firebase client SDK init
│   ├── constants/
│   │   └── theme.ts                      # Light/dark color palette (papaya orange #FF6B35)
│   ├── context/
│   │   ├── AuthContext.tsx               # Firebase auth state and user profile
│   │   └── ThemeContext.tsx              # Theme mode + language (en/si) context
│   └── types/
│       └── index.ts                      # TypeScript interfaces for all API types
│
├── papaya-quality-ml-part/               # Quality ML services
│   └── full_service_quality/
│       ├── 5000/                         # Factory type classifier (Port 5000)
│       │   └── app_for_papaya_type.py    # ConvNeXt + GradCAM
│       ├── 5001/                         # Best grade classifier (Port 5001)
│       │   └── app_for_papaya_grade.py   # Color-based Random Forest + SHAP
│       └── 5002/                         # Customer analysis service (Port 5002)
│           └── app_for_customer.py       # Ripeness / Taste / Quality / Buy models
│
├── papaya-harvest-prediction-ml-part/    # Growth and harvest ML services
│   ├── Image_processing_5008_PORT/       # Growth stage classifier (Port 5008)
│   │   ├── app.py                        # PapayaViT with TTA + Gemini guidance
│   │   └── suggetions.py                 # Stage-specific care knowledge base
│   └── ML_5009_PORT/                     # Harvest prediction service (Port 5009)
│       ├── app.py                        # XGBoost / RF + SHAP + weather
│       ├── weather_pipeline.py           # Open-Meteo integration
│       └── models/
│
├── papaya-leaf-disease-ml-part/          # Leaf disease detection service (Port 5005)
│   ├── app.py                            # ViT disease pipeline + crop advisor
│   ├── crop_advisor.py                   # Prevention and fertilizer advice
│   ├── knowledge_base.json               # Sri Lanka agronomic knowledge
│   ├── llm_client.py                     # GitHub Models / OpenAI-compatible LLM client
│   ├── models/
│   │   ├── disease/                      # ViT disease classification model
│   │   ├── leaf/                         # ViT leaf vs non-leaf validator
│   │   └── stages/                       # ViT severity staging model
│   ├── ML/
│   │   └── fertilizer_model_v2.pkl       # Fertilizer recommendation model
│   └── weather/
│       ├── weather_client.py             # Open-Meteo API client
│       ├── risk_engine_v2.py             # ML-based weather risk engine
│       ├── sri_lanka_regions.py          # District geo-coordinates
│       └── weather_risk_model.pkl        # Trained risk classifier
│
├── papaya-price-prediction-ml-part/      # Market price ML services
│   ├── 5003/                             # Farmer market price service (Port 5003)
│   │   ├── app_for_farmer_market.py      # Gradient Boosting + SHAP
│   │   ├── best_qulity_ml_models/        # Models for Grade I/II/III pricing
│   │   └── factory_outlet_ml_models/     # Models for factory outlet pricing
│   └── 5004/                             # Customer price analysis service (Port 5004)
│       ├── app.py                        # Ripeness + price fairness models
│       └── artifacts/                    # Trained model artifacts
│
└── start-services.bat                    # Windows launcher for all services
```

---

## 4. Feature Modules

### 4.1 User Authentication and Roles

The app supports two roles: **Farmer** and **Customer**. Role selection happens once at registration and determines which features and API endpoints are available.

**Registration (Sign-Up) flow**

The user provides their full name, email address, password, role (Farmer or Customer), and district (Galle, Matara, or Hambantota). Firebase Authentication creates the account and issues a JWT. The backend then creates a matching MongoDB user document storing the uid, email, name, role, district, and an optional profile photo (stored as a base64 string).

**Login flow**

Firebase Authentication validates the credentials and issues an ID token. The frontend stores a token getter that calls `firebaseUser.getIdToken()` before each request, ensuring tokens are always fresh (Firebase tokens expire after one hour). Every backend API call carries the token in the `Authorization: Bearer <token>` header and is verified by the `auth.js` middleware using the Firebase Admin SDK.

**Profile management**

Users can update their display name and upload a profile photo from the Profile tab. The photo is converted to base64 and persisted in MongoDB alongside the user document. The profile screen also displays role and district information.

---

### 4.2 Papaya Quality Assessment – Farmer

**Access:** Farmer role only
**Route:** `POST /api/quality/farmer`
**ML Services used:** Port 5000 (factory outlet path), Port 5001 (best quality path)

This module helps farmers determine the market grade of their papaya before sale. There are two distinct assessment paths based on the intended sales channel.

#### Best Quality Path (Grades I, II, III)

The farmer provides the following inputs through the `farmer-input.tsx` screen:
- Farmer identification number
- District of cultivation (Galle, Matara, or Hambantota)
- Papaya variety (Red Lady, Tenim, or Solo)
- Maturity stage at time of picking
- Number of days since the fruit was plucked
- A clear photograph of the papaya

The backend forwards the image and metadata to the quality grading service on **Port 5001**, which performs the following steps:

1. The image is loaded into memory and resized to 150x150 pixels.
2. The centre 50-pixel radius of the image is isolated to focus on the fruit skin rather than background.
3. Pixels with extreme brightness or darkness are filtered out to remove noise.
4. The median RGB values of the remaining centre pixels are computed to derive a dominant colour.
5. These RGB values, combined with the farmer-supplied metadata (district, variety, maturity stage, and days since plucking), form a 7-feature input vector.
6. A trained **Random Forest classifier** predicts the grade (A, B, C, or D) along with a probability score for each class.
7. **SHAP TreeExplainer** generates per-feature importance values returned as human-readable explanations highlighting which factors most influenced the grade.

The response includes the predicted grade, the confidence percentage, the SHAP-based explanation of key contributing factors, and detailed farming suggestions appropriate for that grade level.

#### Factory Outlet Path

For bruised or damaged fruit destined for factory processing, the farmer photographs the affected area. The backend forwards this image to the factory type service on **Port 5000**, which operates as follows:

1. A **ConvNeXt-Tiny** CNN pre-trained on ImageNet, with its classifier head replaced by a 2-class linear layer, performs binary classification into **Type A** (suitable for processing) or **Type B** (lower quality). Images are resized to 384x384 and normalised using ImageNet statistics.
2. **Captum LayerGradCAM** generates attribution maps on the final ConvNeXt feature block, producing a text description of the visual regions the model attended to.
3. A prior papaya validation check (`check_papaya.py`) confirms that the uploaded image is a papaya before classification proceeds.

The response includes the factory type prediction, confidence score, and a natural-language explanation of the model's reasoning in English or Sinhala based on the `lang` parameter.

---

### 4.3 Papaya Quality Assessment – Customer

**Access:** All authenticated users
**Route:** `POST /api/quality/customer`
**ML Service:** Port 5002

Customers can assess the quality and fair market value of a papaya they intend to purchase.

**Inputs:**
- A photograph of the papaya (used for colour analysis)
- The seller's stated price per kilogram

**Processing pipeline on Port 5002:**

1. The image is converted to the HSV colour space and resized to 224x224 pixels.
2. HSV hue-based masks segment the image into green (hue 35–85), yellow (hue 20–35), and orange (hue 10–20) regions. The resulting pixel proportions form a normalised colour ratio vector.
3. This colour vector, combined with weather data fetched from Open-Meteo for the relevant district, feeds into four separate trained scikit-learn models:
   - **Ripeness model** – classifies the fruit as Unripe, Half Ripe, Market Ready, or Overripe
   - **Taste model** – predicts likely taste profile (Sweet, Bitter, Balanced, Sour, or Mild) informed by recent temperature conditions
   - **Quality grade model** – assigns a quality score of 1, 2, or 3
   - **Buying recommendation model** – outputs Buy, Do Not Buy, or Consider
4. **SHAP KernelExplainer** (for Gradient Boosting models) or **SHAP TreeExplainer** (for tree models) provides factor-level explanations of each prediction.

The seller price is compared against the ML-predicted fair price range to produce a label of Underpriced, Fair, or Overpriced. All outputs are available in English and Sinhala.

---

### 4.4 Leaf Disease Detection

**Access:** Farmer role (primary use case)
**Route:** `POST /api/leaf/predict`
**ML Service:** Port 5005

This module analyses a photograph of a papaya leaf and returns the disease classification, severity, weather-based infection risk, treatment recommendations, and fertilizer advice.

**Processing pipeline on Port 5005:**

**Step 1 – Leaf validation**
A ViT (Vision Transformer) model first determines whether the uploaded image is a papaya leaf. If the model's probability for the "leaf" class falls below the confidence threshold, the request returns the message "This does not look like a papaya leaf" and processing stops.

**Step 2 – Disease classification**
A second ViT model, loaded via Hugging Face `transformers.ViTForImageClassification`, classifies the leaf into one of five categories:
- Healthy
- Anthracnose (Colletotrichum gloeosporioides fungal disease)
- Mosaic Virus (PapMV, spread by aphids)
- Mite disease (Tetranychus urticae spider mites)
- Leaf Curl (caused by whitefly- and thrips-transmitted viruses)

**Step 3 – Severity staging**
A third ViT model classifies the disease progression into Mild, Moderate, or Severe stages.

**Step 4 – Weather risk assessment**
The system fetches a 7-day weather forecast from Open-Meteo using the GPS coordinates of the farmer's district (from `sri_lanka_regions.py`). A trained scikit-learn weather risk classifier (`weather_risk_model.pkl`) ingests temperature, humidity, and rainfall statistics to output a disease spread risk level: LOW, MEDIUM, HIGH, or CRITICAL. If the model is unavailable, a rule-based fallback engine (`risk_engine_v2.py`) computes the risk score from meteorological thresholds.

**Step 5 – Treatment and prevention recommendations**
A static prevention pack lookup table maps each (disease, severity) combination to a list of Sri Lanka–specific treatment codes resolved from `crop_advisor.py` and `knowledge_base.json`. Recommendations include specific chemical treatments (Mancozeb 75WP for anthracnose, Abamectin 1.8EC for mites), cultural practices such as sanitation pruning and drainage improvement, and Integrated Pest Management (IPM) warnings.

**Step 6 – Fertilizer recommendation**
A separate `fertilizer_model_v2.pkl` scikit-learn classifier recommends a fertilizer regimen based on the disease type, severity, and weather conditions. If unavailable, a default advice string from `crop_advisor.py` is used.

**Step 7 – LLM-enhanced guidance (optional)**
An optional LLM call via `llm_client.py` (using the GitHub Models / OpenAI-compatible endpoint) can generate extended natural-language advice, configurable via environment variable.

The complete response includes disease name, disease confidence, severity level, weather risk level, treatment steps, fertilizer recommendation, and disease explanation — all in English and Sinhala.

---

### 4.5 Growth Stage Detection

**Access:** Farmer role
**Route:** `POST /api/growth/stage`
**ML Service:** Port 5008

A farmer photographs their papaya plant and the system identifies the current growth stage along with stage-appropriate care instructions.

**Growth stages:**

| Stage | Common Name | Age | Typical Height | Key Characteristics |
|---|---|---|---|---|
| Stage A | Seedling | 0–2 months | 15–30 cm | 4–8 true leaves, thin stems, developing taproot |
| Stage B | Juvenile | 2–5 months | 40–100 cm | 15–25 leaves, stem 3–5 cm diameter, active vegetative growth |
| Stage C | Pre-fruiting | 5–8 months | 100–180 cm | Flower buds at leaf axils, 25–35 leaves |
| Stage D | Fruiting | 8+ months | 180–250 cm | Visible fruit development, leaves yellowing at base |

**Processing pipeline on Port 5008:**

1. A prior papaya plant validation step rejects non-papaya images.
2. A custom **PapayaViT** model performs stage classification. This model uses a `timm` ViT-base backbone with a custom `AttentionPool` module (multi-head attention pooling with a learnable query vector and LayerNorm) followed by a 4-class classifier head.
3. **Test-Time Augmentation (TTA)** is applied: the same image is passed through four different transforms (standard validation crop, horizontal flip, zoomed-in crop, and padded crop), and predictions are averaged to improve robustness.
4. The predicted stage code triggers a lookup in `suggetions.py`, which contains a structured knowledge base with detailed care instructions per stage:
   - Watering schedule and volumes per plant
   - Fertilizer type, dosage, and frequency (for example, NPK 15-15-15 at 10–15 g every 2 weeks for Stage A)
   - Pest and weather protection measures
   - Soil pH targets and mulching guidance
   - Spacing recommendations
   - Signs indicating readiness to transition to the next stage
5. Optional Gemini AI integration (`GEMINI_API_KEY`) generates extended guidance. If the key is absent, the static knowledge base is used.

The response includes the stage name (English and Sinhala), plant height range, growth duration, current characteristics, full care instructions, and transition guidance.

---

### 4.6 Harvest Prediction

**Access:** Farmer role
**Route:** `POST /api/growth/harvest`
**ML Service:** Port 5009

This feature predicts the expected harvest date and yield for a papaya cultivation plot based on agronomic and weather inputs.

**Required form inputs (via `harvest-form.tsx`):**
- District (Galle, Matara, or Hambantota)
- Soil type (Loam, Sandy Loam, or Laterite)
- Watering method (Drip, Manual, or Sprinkler)
- Watering frequency (expressed as times per day or week, for example "2/week" or "daily")
- Number of papaya trees in the plot
- Month of planting (1–12 or full month name)

**Processing pipeline on Port 5009:**

1. All string inputs are normalised against lookup dictionaries to handle case and spelling variations.
2. Live 7-day weather forecast data is fetched from Open-Meteo for the specified district. Weather features include temperature statistics, rainfall totals, and humidity.
3. Agronomic and weather features are combined into a feature vector, scaled using a pre-trained `StandardScaler`, and passed to two ensemble models:
   - `yield_model.pkl` predicts the expected fruit yield
   - `harvest_model.pkl` predicts the total days until harvest
4. Days already elapsed since planting are subtracted to compute remaining days to harvest.
5. **SHAP explainers** (`shap_yield.pkl`, `shap_harvest.pkl`) identify which factors — soil type, rainfall, watering frequency, and others — most influenced the predictions.

The response includes the predicted harvest date, expected yield, remaining days, and a ranked list of SHAP factors.

---

### 4.7 Market Price Prediction – Farmer

**Access:** Farmer role only
**Route:** `POST /api/market/predict`
**ML Service:** Port 5003

Farmers can predict the expected market selling price before bringing their harvest to market.

**Required form inputs:**
- District
- Papaya variety
- Cultivation method
- Quality grade (Grade I, II, or III for best quality; Factory Outlet for damaged fruit)
- Total number of papayas in the harvest
- Average weight per fruit in kilograms
- Expected selling date (today, 1–2 days, 3–4 days, or 5+ days)

The backend routes Grade I, II, and III to `/martket_data_predict` using the best quality model bundle, and Factory Outlet to `/factory_outlet_price_predict` using the factory model bundle.

**Processing pipeline on Port 5003:**

1. The last 7 days of rainfall data is fetched from Open-Meteo for the given district.
2. A rainfall impact score and seasonal month encoding (sine/cosine transformation) are computed. Harvest density and total harvest weight are derived from inputs.
3. All features are passed to a **Gradient Boosting** pipeline to predict: price per kilogram, total harvest value, and best day of the week to sell.
4. **SHAP TreeExplainer** produces per-feature importance values. Human-readable factor names (for example, "recent weather conditions", "seasonal market cycle", "planned selling time") are returned alongside SHAP scores.
5. A summary template from `summary_templates.json` is filled with predictions to form a natural-language market summary.

The response includes predicted price per kg, total predicted income, suggested selling day, a narrative summary, and a ranked list of influential factors.

---

### 4.8 Market Price Analysis – Customer

**Access:** All authenticated users
**Route:** `POST /api/market/customer-predict`
**ML Service:** Port 5004

Customers can photograph a papaya at a market stall and evaluate whether the asking price is fair.

**Inputs:**
- A photograph of the papaya
- The seller's stated price per kilogram
- Papaya variety (Red Lady or Tainung)
- City or district (used for weather data)

**Processing pipeline on Port 5004:**

1. A papaya validation check confirms the uploaded image contains a papaya.
2. Dominant colour extraction computes the median RGB pixel values from the centre region of the image and converts them to an orange/green/yellow ratio vector.
3. Live weather data (temperature and humidity) is fetched from Open-Meteo for the nearest district coordinates.
4. The colour ratios and weather features are passed to a **ripeness classifier** (Unripe, Half Ripe, Market Ready, or Overripe) and a **price regression model** (expected fair market price per kg).
5. **SHAP** generates explanations for the price prediction.
6. `suggestion_maker.py` generates a buying recommendation based on ripeness and the comparison between the predicted fair price and the seller's stated price.

The response includes the ripeness label, the predicted fair price range, a comparison label (Underpriced, Fair, or Overpriced), the buying recommendation, and a ranked list of influential factors.

---

## 5. ML Microservices Reference

| Port | Service | Module Path | Purpose | Key Models |
|---|---|---|---|---|
| 5000 | Factory Type Service | `papaya-quality-ml-part/full_service_quality/5000/` | Classifies factory outlet papaya as Type A or Type B | ConvNeXt-Tiny, Captum LayerGradCAM |
| 5001 | Best Grade Service | `papaya-quality-ml-part/full_service_quality/5001/` | Grades best-quality papaya (A/B/C/D) from colour features and metadata | Random Forest, SHAP TreeExplainer |
| 5002 | Customer Quality Service | `papaya-quality-ml-part/full_service_quality/5002/` | Predicts ripeness, taste, quality grade, and buying recommendation | scikit-learn pipelines, SHAP |
| 5003 | Farmer Market Price Service | `papaya-price-prediction-ml-part/5003/` | Predicts fair market selling price and best selling day for farmers | Gradient Boosting, SHAP TreeExplainer |
| 5004 | Customer Market Price Service | `papaya-price-prediction-ml-part/5004/` | Detects ripeness from image colour and evaluates price fairness | Gradient Boosting, SHAP KernelExplainer |
| 5005 | Leaf Disease Service | `papaya-leaf-disease-ml-part/` | Full leaf disease pipeline with weather risk and agronomic advice | ViT (Hugging Face), scikit-learn risk model |
| 5008 | Growth Stage Service | `papaya-harvest-prediction-ml-part/Image_processing_5008_PORT/` | Classifies papaya growth stage from plant image using TTA | PapayaViT (custom timm ViT), Gemini AI |
| 5009 | Harvest Prediction Service | `papaya-harvest-prediction-ml-part/ML_5009_PORT/` | Predicts harvest date and yield from agronomic inputs and live weather | XGBoost / Random Forest, SHAP |

All ML services are Flask applications with CORS enabled. Each service is self-contained with its own model files (`.pkl`, `.pth`, `.joblib`) and dependencies. Services are called internally by the backend only.

---

## 6. Backend API Reference

Base URL: `http://<server_host>:3000/api`
All routes except the health check require: `Authorization: Bearer <firebase_id_token>`

### Users

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/users` | Create user profile after sign-up | Authenticated |
| GET | `/users/me` | Get current user profile | Authenticated |
| PUT | `/users/profile` | Update display name | Authenticated |
| POST | `/users/upload-profile-photo` | Upload and store profile photo (5 MB limit) | Authenticated |

### Growth

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/growth/stage` | Classify plant growth stage from image | Farmer |
| POST | `/growth/harvest` | Predict harvest date and yield | Farmer |

### Quality

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/quality/farmer` | Grade papaya quality (best quality or factory outlet path) | Farmer |
| POST | `/quality/customer` | Analyse papaya for customer purchase decision | All |

### Market

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/market/predict` | Predict market selling price for farmer's harvest | Farmer |
| POST | `/market/customer-predict` | Evaluate price fairness for customer at market | All |

### Leaf

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/leaf/predict` | Detect leaf disease, severity, and get treatment plan | Farmer |

### Health

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | API status and version |
| GET | `/health` | Health check with timestamp |

**MongoDB Prediction Log Schema**

Every prediction request is asynchronously logged to the `PredictionLog` collection with the following fields:
- `userId` — Firebase UID of the requesting user
- `type` — one of `growth_stage`, `harvest`, `farmer_quality`, `customer_quality`, `market_price`, `leaf_disease`
- `input` — the raw request body
- `output` — the ML service response
- `createdAt` — timestamp, indexed alongside `userId` for efficient history queries

---

## 7. Frontend Application

The frontend is built with **React Native** (Expo SDK 54) and **TypeScript** using **Expo Router** for file-based navigation.

### Navigation Structure

- The root `_layout.tsx` wraps the entire app in `AuthProvider` and `ThemeProvider`.
- Unauthenticated users are redirected to `onboarding.tsx` and then to `login.tsx` or `signup.tsx`.
- Authenticated users land on the bottom-tab navigator (home, explore, profile, settings, about).
- Feature screens are nested under `growth/`, `leaf/`, `quality/`, and `market/` route groups.

### Theme and Language

Users can switch between **light** and **dark** themes (or follow the system setting) from the Settings tab. The primary brand colour is papaya orange (`#FF6B35` in light mode, `#FFA06B` in dark mode), with teal secondary (`#00D9C0`). Settings are persisted to `AsyncStorage`.

Language can be toggled between **English** and **Sinhala** from the Settings tab. The `useTheme()` hook exposes a `t(key)` translation function consumed by all screens. Language preference is also persisted to `AsyncStorage`.

### Image Uploads

All ML features that require images use `expo-image-picker`. The user can select from the camera roll or take a new photo. Images are sent as `multipart/form-data` through the `axios` instance in `api.ts`.

### API Client

The `api.ts` module creates an `axios` instance pointed at the backend base URL (auto-detected from the Expo debugger host or configured in `app.json`). A request interceptor attaches a fresh Firebase ID token to every outgoing request. The timeout is set to 60 seconds to accommodate ML inference latency.

### Key Screens

| Screen | File Path | Description |
|---|---|---|
| Onboarding | `app/onboarding.tsx` | Introductory slides shown on first launch |
| Login | `app/login.tsx` | Email and password login via Firebase |
| Sign Up | `app/signup.tsx` | Registration with role and district selection |
| Home | `app/(tabs)/index.tsx` | Role-aware dashboard with feature cards |
| Profile | `app/(tabs)/profile.tsx` | Name, district, role, and profile photo management |
| Settings | `app/(tabs)/settings.tsx` | Theme mode and language selection |
| Growth Stage Check | `app/growth/stage-check.tsx` | Camera or gallery image picker for plant classification |
| Growth Stage Result | `app/growth/stage-result.tsx` | Stage, care instructions, and transition guidance |
| Harvest Form | `app/growth/harvest-form.tsx` | Agronomic input form |
| Harvest Result | `app/growth/harvest-result.tsx` | Predicted harvest date, yield, and SHAP factors |
| Leaf Scan | `app/leaf/scan.tsx` | Image picker for leaf disease detection |
| Leaf Result | `app/leaf/result.tsx` | Disease, severity, weather risk, and treatment plan |
| Leaf History | `app/leaf/history.tsx` | Past leaf scan records |
| Quality Farmer Input | `app/quality/farmer-input.tsx` | Papaya details and image upload for grading |
| Quality Farmer Result | `app/quality/farmer-result.tsx` | Grade, confidence, and SHAP explanation |
| Quality Customer Input | `app/quality/customer-input.tsx` | Image and price inputs |
| Quality Customer Result | `app/quality/customer-result.tsx` | Ripeness, taste, quality score, buy recommendation |
| Market Predict Form | `app/market/predict-form.tsx` | Harvest details for price prediction (farmer) |
| Market Result | `app/market/result.tsx` | Predicted price, income, best selling day |
| Market Customer Predict | `app/market/customer-predict.tsx` | Image and seller price for fairness check |
| Market Customer Result | `app/market/customer-result.tsx` | Ripeness, fair price, and price fairness label |

---

## 8. Technology Stack

### Frontend

| Component | Technology | Version |
|---|---|---|
| Framework | React Native (Expo) | Expo SDK 54 |
| Language | TypeScript | 5.9 |
| Navigation | Expo Router (file-based) | 6.0 |
| State Management | React Context API | – |
| Authentication | Firebase JS SDK | 11.0 |
| HTTP Client | Axios | 1.7 |
| Image Picker | expo-image-picker | 16.0 |
| Persistent Storage | AsyncStorage | 2.1 |
| Animation | React Native Reanimated | 4.1 |
| Icons | @expo/vector-icons | 15.0 |
| Gradients | expo-linear-gradient | 15.0 |

### Backend

| Component | Technology | Version |
|---|---|---|
| Runtime | Node.js | – |
| Framework | Express | 4.18 |
| Database ODM | Mongoose | 8.0 |
| Database | MongoDB Atlas | – |
| Authentication | Firebase Admin SDK | 12.0 |
| File Uploads | Multer (memory storage) | 1.4 |
| HTTP Proxy Client | Axios | 1.13 |
| Logging | Morgan | 1.10 |

### ML Services

| Component | Technology | Notes |
|---|---|---|
| Web Framework | Flask + Flask-CORS | Used across all ML services |
| Deep Learning | PyTorch + torchvision | ViT, ConvNeXt, PapayaViT models |
| Transformers | Hugging Face transformers | ViT for leaf disease classification |
| Model Backbone Library | timm | ViT-base backbone for growth stage |
| Classical ML | scikit-learn | Random Forest, Gradient Boosting pipelines |
| Model Persistence | joblib, pickle | All sklearn and custom model artifacts |
| Explainability | SHAP | TreeExplainer and KernelExplainer |
| Visual Explainability | Captum (LayerGradCAM) | Factory outlet type service |
| Image Processing | Pillow, OpenCV (cv2) | Colour extraction and HSV analysis |
| Numerical Computing | NumPy, Pandas | Feature engineering across all services |
| Weather API | Open-Meteo | Real-time weather for 5 of 7 ML services |
| LLM Integration | OpenAI-compatible endpoint | Extended leaf disease advisory (optional) |

---

## 9. Installation and Setup

### Prerequisites

- Node.js 18 or later
- Python 3.10 or later
- MongoDB Atlas account with a connection string
- Firebase project with Email/Password authentication enabled
- Firebase service account key JSON file
- Expo CLI (`npm install -g expo-cli`)

### Step 1 – Clone the repository

```bash
git clone https://github.com/Akilaamarasinghe/Papaya-Pulse.git
cd Papaya-Pulse
```

### Step 2 – Configure the backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory with the contents shown in the Environment Variables section. Place your Firebase service account JSON file at `backend/config/firebase-service-account.json`.

### Step 3 – Install Python dependencies for each ML service

Each ML service directory contains its own `requirements.txt`. Install them in separate virtual environments or a shared environment.

**Leaf disease service (Port 5005):**
```bash
cd papaya-leaf-disease-ml-part
pip install -r requirements.txt
```

**Market price services (Ports 5003, 5004):**
```bash
cd papaya-price-prediction-ml-part
pip install -r requirements.txt
```

**Quality and harvest services (Ports 5000, 5001, 5002, 5008, 5009)** require: `torch`, `torchvision`, `timm`, `flask`, `flask-cors`, `pillow`, `numpy`, `pandas`, `scikit-learn`, `joblib`, `shap`, `captum`, `requests`.

### Step 4 – Start all ML services

On Windows, use the provided launcher:

```bash
start-services.bat
```

To start services manually, open a separate terminal for each:

```bash
# Port 5000 – Factory type classifier
cd papaya-quality-ml-part/full_service_quality/5000
python app_for_papaya_type.py

# Port 5001 – Best grade classifier
cd papaya-quality-ml-part/full_service_quality/5001
python app_for_papaya_grade.py

# Port 5002 – Customer quality analysis
cd papaya-quality-ml-part/full_service_quality/5002
python app_for_customer.py

# Port 5003 – Farmer market price
cd papaya-price-prediction-ml-part/5003
python app_for_farmer_market.py

# Port 5004 – Customer market price
cd papaya-price-prediction-ml-part/5004
python app.py

# Port 5005 – Leaf disease detection
cd papaya-leaf-disease-ml-part
python app.py

# Port 5008 – Growth stage classifier
cd papaya-harvest-prediction-ml-part/Image_processing_5008_PORT
python app.py

# Port 5009 – Harvest prediction
cd papaya-harvest-prediction-ml-part/ML_5009_PORT
python app.py
```

### Step 5 – Start the backend

```bash
cd backend
npm run dev
```

The API server starts on `http://localhost:3000`. For mobile device access on the same Wi-Fi network, find your machine's local IP using `ipconfig` (Windows) or `ifconfig` (macOS/Linux).

### Step 6 – Configure the frontend API URL

Open `frontend/app.json` and set your machine's local IP:

```json
{
  "extra": {
    "apiUrl": "http://192.168.x.x:3000/api"
  }
}
```

If this field is absent, the app attempts to auto-detect the host from the Expo debugger manifest.

### Step 7 – Start the frontend

```bash
cd frontend
npm install
npx expo start
```

Scan the QR code with the **Expo Go** app on your Android or iOS device. Press `a` to launch an Android emulator or `i` to launch an iOS simulator.

---

## 10. Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|---|---|---|
| `PORT` | Backend server port | `3000` |
| `MONGODB_URI` | MongoDB Atlas connection string | Required |
| `NODE_ENV` | Runtime environment (`development` / `production`) | `development` |
| `ALLOWED_ORIGINS` | Comma-separated CORS origin whitelist | `*` |
| `ML_SERVICE_URL` | Harvest prediction service base URL | `http://localhost:5009` |
| `ML_STAGE_SERVICE_URL` | Growth stage service base URL | `http://localhost:5008` |
| `ML_FACTORY_TYPE_SERVICE` | Factory type classifier base URL | `http://localhost:5000` |
| `ML_BEST_GRADE_SERVICE` | Best grade classifier base URL | `http://localhost:5001` |
| `ML_CUSTOMER_SERVICE` | Customer quality service base URL | `http://localhost:5002` |
| `FARMER_ML_SERVICE_URL` | Farmer market price service base URL | `http://localhost:5003` |
| `CUSTOMER_ML_SERVICE_URL` | Customer market price service base URL | `http://localhost:5004` |
| `LEAF_ML_SERVICE_URL` | Leaf disease service base URL | `http://localhost:5005` |
| `LEAF_ML_TIMEOUT` | Leaf ML request timeout in milliseconds | `45000` |

### Leaf Disease Service (`papaya-leaf-disease-ml-part/.env`)

| Variable | Description |
|---|---|
| `OPENAI_API_KEY` or `GITHUB_TOKEN` | API key for LLM-enhanced advisory text (optional feature) |

### Frontend (`frontend/app.json` under `extra`)

| Key | Description |
|---|---|
| `apiUrl` | Full backend API base URL including the `/api` suffix |

---

## 11. Contributors

SLIIT – 4th Year IT Undergraduate Research Team
Project: Papaya Pulse

| Name | GitHub |
|---|---|
| Akila Amarasinghe | [Akilaamarasinghe](https://github.com/Akilaamarasinghe) |
| Udan Jayasekara | [Udanpasindu](https://github.com/Udanpasindu) |
| Athsara Weththasinghe | [athsarab](https://github.com/athsarab) |
| Sachini Tharindi | [SachiniTharindi](https://github.com/SachiniTharindi) |

GitHub Repository: https://github.com/Akilaamarasinghe/Papaya-Pulse
