import os
import json
import numpy as np
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OrdinalEncoder, StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.metrics import accuracy_score, classification_report, mean_squared_error, mean_absolute_error, r2_score

from sklearn.ensemble import GradientBoostingClassifier, GradientBoostingRegressor

RANDOM_STATE = 42
ARTIFACT_DIR = "artifacts"
os.makedirs(ARTIFACT_DIR, exist_ok=True)

# =========================
# LOAD DATA
# =========================
CSV_PATH = "customer_papaya_price.csv"
df = pd.read_csv(CSV_PATH)

print(f"Loaded {len(df)} rows from {CSV_PATH}")
print(f"Columns: {df.columns.tolist()}")

# =========================
# BASIC CLEANING
# =========================
required_cols = [
    'district', 'variety', 'month',
    'green_ratio', 'yellow_ratio', 'orange_ratio',
    'ripeness_stage', 'last7_days_rainfall',
    'price_lkr_per_kg'
]

missing = [c for c in required_cols if c not in df.columns]
if missing:
    raise ValueError(f"Missing columns: {missing}")

# Ensure numeric
for c in ['green_ratio', 'yellow_ratio', 'orange_ratio', 'last7_days_rainfall', 'price_lkr_per_kg']:
    df[c] = pd.to_numeric(df[c], errors='coerce')

# Month handling (string -> numeric)
if df['month'].dtype == object:
    try:
        df['month'] = pd.to_datetime(df['month'], format='%B').dt.month
    except Exception:
        df['month'] = pd.to_numeric(df['month'], errors='coerce')

# Ensure ripeness_stage is integer
df['ripeness_stage'] = pd.to_numeric(df['ripeness_stage'], errors='coerce').astype('Int64')

# Drop invalid rows
df = df.dropna().reset_index(drop=True)

print(f"\nAfter cleaning: {len(df)} rows")
print(f"Ripeness stages: {sorted(df['ripeness_stage'].unique())}")
print(f"Varieties: {sorted(df['variety'].unique())}")
print(f"Districts: {sorted(df['district'].unique())}")
print(f"\nPrice stats:\n{df['price_lkr_per_kg'].describe()}")

# Check price distribution by variety
print("\n=== PRICE BY VARIETY ===")
for variety in sorted(df['variety'].unique()):
    variety_prices = df[df['variety'] == variety]['price_lkr_per_kg']
    print(f"{variety}: Mean={variety_prices.mean():.2f}, Min={variety_prices.min():.2f}, Max={variety_prices.max():.2f}, Count={len(variety_prices)}")

# Check if variety actually affects price
print("\n=== VARIETY IMPACT CHECK ===")
variety_price_std = df.groupby('variety')['price_lkr_per_kg'].std()
print(f"Price variation within varieties:\n{variety_price_std}")
if variety_price_std.max() < 10:
    print("WARNING: Very low price variation between varieties - model may not differentiate well!")

# =========================
# FEATURE GROUPS
# =========================
NUMERIC_BASE = [
    'month',
    'green_ratio', 'yellow_ratio', 'orange_ratio',
    'last7_days_rainfall'
]

CAT_BASE = ['district']
CAT_PRICE_EXTRA = ['variety']

# =========================
# PREPROCESSORS
# =========================
def build_preprocessor(cat_cols, num_cols):
    return ColumnTransformer([
        ('num', Pipeline([
            ('imp', SimpleImputer(strategy='median')),
            ('sc', StandardScaler())
        ]), num_cols),
        ('cat', Pipeline([
            ('imp', SimpleImputer(strategy='most_frequent')),
            ('enc', OrdinalEncoder(handle_unknown='use_encoded_value', unknown_value=-1))
        ]), cat_cols)
    ])

# =========================
# STAGE 1: RIPENESS MODEL
# =========================
print("\n" + "="*60)
print("TRAINING RIPENESS MODEL")
print("="*60)

X_ripeness = df[CAT_BASE + NUMERIC_BASE].copy()
y_ripeness = df['ripeness_stage'].astype(int)

print(f"\nX_ripeness shape: {X_ripeness.shape}")
print(f"y_ripeness shape: {y_ripeness.shape}")
print(f"y_ripeness distribution:\n{y_ripeness.value_counts().sort_index()}")

ripeness_preproc = build_preprocessor(CAT_BASE, NUMERIC_BASE)

ripeness_model = Pipeline([
    ('preproc', ripeness_preproc),
    ('model', GradientBoostingClassifier(
        n_estimators=300,
        learning_rate=0.05,
        max_depth=3,
        random_state=RANDOM_STATE
    ))
])

Xr_train, Xr_test, yr_train, yr_test = train_test_split(
    X_ripeness, y_ripeness, test_size=0.2, random_state=RANDOM_STATE, stratify=y_ripeness
)

print(f"\nTrain size: {len(Xr_train)}, Test size: {len(Xr_test)}")

ripeness_model.fit(Xr_train, yr_train)

yr_pred = ripeness_model.predict(Xr_test)

print(f"\nRipeness Model Accuracy: {accuracy_score(yr_test, yr_pred):.4f}")
print("\nClassification Report:")
print(classification_report(yr_test, yr_pred))

joblib.dump(ripeness_model, f"{ARTIFACT_DIR}/ripeness_model.joblib")
print(f"\n✓ Saved: {ARTIFACT_DIR}/ripeness_model.joblib")

# =========================
# STAGE 2: PRICE MODEL
# =========================
print("\n" + "="*60)
print("TRAINING PRICE MODEL")
print("="*60)

X_price = df[CAT_BASE + CAT_PRICE_EXTRA + NUMERIC_BASE + ['ripeness_stage']].copy()
y_price = df['price_lkr_per_kg']

print(f"\nX_price shape: {X_price.shape}")
print(f"y_price shape: {y_price.shape}")
print(f"y_price range: [{y_price.min():.2f}, {y_price.max():.2f}]")

price_preproc = build_preprocessor(CAT_BASE + CAT_PRICE_EXTRA, NUMERIC_BASE + ['ripeness_stage'])

price_model = Pipeline([
    ('preproc', price_preproc),
    ('model', GradientBoostingRegressor(
        n_estimators=400,
        learning_rate=0.05,
        max_depth=4,
        random_state=RANDOM_STATE
    ))
])

Xp_train, Xp_test, yp_train, yp_test = train_test_split(
    X_price, y_price, test_size=0.2, random_state=RANDOM_STATE
)

print(f"\nTrain size: {len(Xp_train)}, Test size: {len(Xp_test)}")

price_model.fit(Xp_train, yp_train)

yp_pred = price_model.predict(Xp_test)

mse = mean_squared_error(yp_test, yp_pred)
rmse = np.sqrt(mse)
mae = mean_absolute_error(yp_test, yp_pred)
r2 = r2_score(yp_test, yp_pred)

print("\nPrice Model Performance:")
print(json.dumps({
    'rmse': round(rmse, 2),
    'mae': round(mae, 2),
    'r2': round(r2, 4)
}, indent=2))

joblib.dump(price_model, f"{ARTIFACT_DIR}/price_model.joblib")
print(f"\n✓ Saved: {ARTIFACT_DIR}/price_model.joblib")

print("\n" + "="*60)
print("TRAINING COMPLETE")
print("="*60)
print(f"\nModels saved in '{ARTIFACT_DIR}/' directory")
print("Ready for inference with app.py")