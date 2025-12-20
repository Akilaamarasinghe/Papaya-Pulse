import pandas as pd
import numpy as np
import pickle
import shap
import warnings

from sklearn.model_selection import train_test_split, KFold, cross_val_score
from sklearn.preprocessing import RobustScaler
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
from xgboost import XGBRegressor

warnings.filterwarnings("ignore")

RANDOM_STATE = 42

# =========================================================
# LOAD DATA
# =========================================================
print("Loading dataset...")
df = pd.read_csv("papaya_dataset.csv")
df = df.dropna().reset_index(drop=True)

# =========================================================
# BASIC CLEANING
# =========================================================
watering_map = {
    "1/day": 7,
    "2/day": 14,
    "3/day": 21,
    "every 2 days": 3.5,
    "2/week": 2,
    "3/week": 3,
    "4/week": 4,
    "5/week": 5,
    "daily": 7
}

month_map = {
    "January": 1, "February": 2, "March": 3, "April": 4,
    "May": 5, "June": 6, "July": 7, "August": 8,
    "September": 9, "October": 10, "November": 11, "December": 12
}

df["watering_freq_num"] = df["watering_frequency"].map(watering_map)
df["plant_month_num"] = df["plant_month"].map(month_map)

df["watering_freq_num"].fillna(df["watering_freq_num"].median(), inplace=True)
df["plant_month_num"].fillna(df["plant_month_num"].median(), inplace=True)

# =========================================================
# AGRONOMY-AWARE FEATURE ENGINEERING
# =========================================================

# Rain stress (too much rain hurts yield)
df["rain_intensity"] = df["total_rain"] / (df["rainy_days"] + 1)

# Temperature comfort zone (Papaya likes ~25–32°C)
df["temp_stress"] = np.abs(df["avg_temp"] - 28)

# Per-tree resource availability
df["rain_per_tree"] = df["total_rain"] / (df["trees_count"] + 1)

# Seasonal logic (Sri Lanka)
df["is_monsoon"] = df["plant_month_num"].isin([5, 6, 7, 8, 9]).astype(int)
df["is_dry"] = df["plant_month_num"].isin([1, 2, 3, 12]).astype(int)

# Interaction (log-safe)
df["temp_rain_synergy"] = np.log1p(df["avg_temp"]) * np.log1p(df["total_rain"])

# =========================================================
# ONE-HOT ENCODING (NO FAKE ORDERING)
# =========================================================
df = pd.get_dummies(
    df,
    columns=["district", "soil_type", "watering_method"],
    drop_first=True
)

# =========================================================
# FEATURES & TARGETS
# =========================================================
target_yield = "yield_per_tree"
target_harvest = "harvest_days"

drop_cols = [
    "watering_frequency",
    "plant_month",
    "plant_date",
    target_yield,
    target_harvest
]

X = df.drop(columns=drop_cols)
y_yield = df[target_yield]
y_harvest = df[target_harvest]

feature_names = X.columns.tolist()

# =========================================================
# TRAIN / TEST SPLIT
# =========================================================
X_train, X_test, y_yield_train, y_yield_test, y_harvest_train, y_harvest_test = (
    train_test_split(
        X, y_yield, y_harvest,
        test_size=0.2,
        random_state=RANDOM_STATE
    )
)

# =========================================================
# SCALING (ROBUST FOR WEATHER OUTLIERS)
# =========================================================
scaler = RobustScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# =========================================================
# PRODUCTION-GRADE XGBOOST
# =========================================================
def build_xgb():
    return XGBRegressor(
        n_estimators=900,
        max_depth=6,
        learning_rate=0.03,
        subsample=0.85,
        colsample_bytree=0.85,
        min_child_weight=5,
        gamma=0.1,
        reg_alpha=0.3,
        reg_lambda=1.5,
        random_state=RANDOM_STATE,
        n_jobs=-1,
        tree_method="hist"
    )

yield_model = build_xgb()
harvest_model = build_xgb()

# =========================================================
# TRAIN
# =========================================================
print("Training yield model...")
yield_model.fit(X_train_scaled, y_yield_train)

print("Training harvest model...")
harvest_model.fit(X_train_scaled, y_harvest_train)

# =========================================================
# EVALUATION
# =========================================================
def evaluate(model, Xtr, Xte, ytr, yte, name):
    tr_pred = model.predict(Xtr)
    te_pred = model.predict(Xte)

    print(f"\n{name}")
    print(f"Train R² : {r2_score(ytr, tr_pred):.3f}")
    print(f"Test  R² : {r2_score(yte, te_pred):.3f}")
    print(f"RMSE     : {np.sqrt(mean_squared_error(yte, te_pred)):.2f}")
    print(f"MAE      : {mean_absolute_error(yte, te_pred):.2f}")

evaluate(yield_model, X_train_scaled, X_test_scaled, y_yield_train, y_yield_test, "YIELD MODEL")
evaluate(harvest_model, X_train_scaled, X_test_scaled, y_harvest_train, y_harvest_test, "HARVEST MODEL")

# =========================================================
# CROSS-VALIDATION (CLEAN)
# =========================================================
cv = KFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)
cv_yield = cross_val_score(yield_model, X_train_scaled, y_yield_train, cv=cv, scoring="r2")

print(f"\nYield CV R² mean: {cv_yield.mean():.3f}")

# =========================================================
# SHAP (PROPER WAY)
# =========================================================
print("Building SHAP explainers...")

background = shap.sample(X_train_scaled, 200, random_state=RANDOM_STATE)

shap_yield = shap.TreeExplainer(yield_model, background)
shap_harvest = shap.TreeExplainer(harvest_model, background)

# =========================================================
# SAVE EVERYTHING
# =========================================================
with open("yield_model.pkl", "wb") as f:
    pickle.dump(yield_model, f)

with open("harvest_model.pkl", "wb") as f:
    pickle.dump(harvest_model, f)

with open("scaler.pkl", "wb") as f:
    pickle.dump(scaler, f)

with open("feature_names.pkl", "wb") as f:
    pickle.dump(feature_names, f)

with open("shap_yield.pkl", "wb") as f:
    pickle.dump(shap_yield, f)

with open("shap_harvest.pkl", "wb") as f:
    pickle.dump(shap_harvest, f)

print("\n✅ TRAINING COMPLETE — MODELS READY FOR PRODUCTION")
