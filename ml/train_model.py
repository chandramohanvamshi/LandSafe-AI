import pandas as pd
import joblib
import os

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score


# ============================================================
# LOAD DATASET
# ============================================================

dataset_path = "ml/data/processed/model_training_dataset.csv"

df = pd.read_csv(dataset_path)

print("Dataset loaded successfully!")
print("Number of records:", len(df))


# ============================================================
# FEATURES
# ============================================================

features = [
    "elevation_m",
    "slope_degrees",
    "rainfall_mm_24h",
    "rainfall_mm_72h",
    "soil_moisture_percent"
]

target = "landslide"


# Check required columns
missing_columns = [
    column for column in features + [target]
    if column not in df.columns
]

if missing_columns:
    raise ValueError(
        f"Missing columns: {missing_columns}"
    )


X = df[features]
y = df[target]


# ============================================================
# TRAIN / TEST SPLIT
# ============================================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.3,
    random_state=42
)


# ============================================================
# RANDOM FOREST MODEL
# ============================================================

model = RandomForestClassifier(
    n_estimators=200,
    random_state=42,
    class_weight="balanced"
)

model.fit(X_train, y_train)


# ============================================================
# EVALUATION
# ============================================================

y_pred = model.predict(X_test)

accuracy = accuracy_score(
    y_test,
    y_pred
)

print("\n================================")
print("MODEL EVALUATION")
print("================================")

print(
    f"Accuracy: {accuracy * 100:.2f}%"
)

print("\nClassification Report:")

print(
    classification_report(
        y_test,
        y_pred,
        zero_division=0
    )
)


# ============================================================
# FEATURE IMPORTANCE
# ============================================================

print("\n================================")
print("FEATURE IMPORTANCE")
print("================================")

for feature, importance in zip(
    features,
    model.feature_importances_
):
    print(
        f"{feature}: {importance:.3f}"
    )


# ============================================================
# SAVE MODEL
# ============================================================

model_dir = "ml/models"

os.makedirs(
    model_dir,
    exist_ok=True
)

model_path = os.path.join(
    model_dir,
    "saved_model.pkl"
)

joblib.dump(
    model,
    model_path
)


# ============================================================
# SUCCESS
# ============================================================

print("\n================================")
print("SUCCESS!")
print("================================")

print("Model saved successfully at:")
print(model_path)

print("\nModel features:")

for feature in features:
    print(" -", feature)