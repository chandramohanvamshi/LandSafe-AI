from pathlib import Path

import joblib
import pandas as pd

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report, roc_auc_score


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parents[1]

DATA_PATH = (
    BASE_DIR
    / "ml"
    / "data"
    / "raw"
    / "flood_risk_dataset_india.csv"
)

MODEL_DIR = BASE_DIR / "ml" / "models"

MODEL_PATH = MODEL_DIR / "flash_flood_model.pkl"


# ============================================================
# FEATURES
# ============================================================
FEATURES = [
    "Rainfall (mm)",
    "River Discharge (m³/s)",
    "Water Level (m)",
    "Elevation (m)",
    "Historical Floods",
]

TARGET = "Flood Occurred"


# ============================================================
# LOAD DATA
# ============================================================

print("Loading flood dataset...")

df = pd.read_csv(DATA_PATH)

print("Dataset shape:", df.shape)

print("\nColumns:")
print(df.columns.tolist())


# ============================================================
# CHECK REQUIRED COLUMNS
# ============================================================

required_columns = FEATURES + [TARGET]

missing_columns = [
    column
    for column in required_columns
    if column not in df.columns
]

if missing_columns:

    raise ValueError(
        f"Missing columns: {missing_columns}"
    )


# ============================================================
# PREPARE DATA
# ============================================================

X = df[FEATURES].apply(
    pd.to_numeric,
    errors="coerce"
)

y = pd.to_numeric(
    df[TARGET],
    errors="coerce"
)


# Remove invalid rows

clean_data = pd.concat(
    [
        X,
        y.rename(TARGET)
    ],
    axis=1
).dropna()


X = clean_data[FEATURES]

y = clean_data[TARGET].astype(int)


print("\nRows used:", len(clean_data))

print("\nTarget distribution:")
print(y.value_counts())


# ============================================================
# TRAIN / TEST SPLIT
# ============================================================

X_train, X_test, y_train, y_test = train_test_split(

    X,
    y,

    test_size=0.20,

    random_state=42,

    stratify=y
)


print("\nTraining rows:", len(X_train))

print("Testing rows:", len(X_test))


# ============================================================
# RANDOM FOREST
# ============================================================

model = RandomForestClassifier(

    n_estimators=300,

    max_depth=12,

    min_samples_leaf=2,

    random_state=42,

    class_weight="balanced",

    n_jobs=-1
)


print("\nTraining Random Forest...")

model.fit(
    X_train,
    y_train
)


# ============================================================
# EVALUATION
# ============================================================

predictions = model.predict(
    X_test
)

probabilities = model.predict_proba(
    X_test
)[:, 1]


accuracy = accuracy_score(
    y_test,
    predictions
)

print("\n==============================")
print("MODEL RESULTS")
print("==============================")

print(
    f"Accuracy: {accuracy:.4f}"
)


try:

    auc = roc_auc_score(
        y_test,
        probabilities
    )

    print(
        f"ROC-AUC: {auc:.4f}"
    )

except ValueError:

    pass


print("\nClassification Report:")

print(
    classification_report(
        y_test,
        predictions
    )
)


# ============================================================
# FEATURE IMPORTANCE
# ============================================================

importance = pd.DataFrame({

    "feature": FEATURES,

    "importance": model.feature_importances_

}).sort_values(
    "importance",
    ascending=False
)


print("\nFeature Importance:")

print(
    importance.to_string(
        index=False
    )
)


# ============================================================
# SAVE MODEL
# ============================================================

MODEL_DIR.mkdir(
    parents=True,
    exist_ok=True
)


model_bundle = {

    "model": model,

    "features": FEATURES,

    "target": TARGET,

    "model_type": "Random Forest",

    "dataset_note":
        "India-wide synthetic flood-risk dataset"

}


joblib.dump(

    model_bundle,

    MODEL_PATH

)


print("\n==============================")

print(
    "MODEL SAVED:"
)

print(
    MODEL_PATH
)

print("==============================")