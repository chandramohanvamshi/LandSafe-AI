import pandas as pd
import joblib
import os

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


# ============================================================
# CHECK REQUIRED COLUMNS
# ============================================================

missing_columns = [
    column
    for column in features + [target]
    if column not in df.columns
]

if missing_columns:
    raise ValueError(
        f"Missing columns: {missing_columns}"
    )


# ============================================================
# REMOVE INVALID ROWS
# ============================================================

df = df.dropna(
    subset=features + [target]
).copy()

print("Usable records:", len(df))


# ============================================================
# CHECK CLASS DISTRIBUTION
# ============================================================

print("\nClass distribution:")
print(df[target].value_counts())


if df[target].nunique() < 2:
    raise ValueError(
        "Dataset must contain both classes 0 and 1."
    )


X = df[features]
y = df[target]


# ============================================================
# TRAIN MODEL
# ============================================================

# Current dataset is extremely small.
# Therefore, use all available records for training.

X_train = X
y_train = y


# ============================================================
# RANDOM FOREST MODEL
# ============================================================

model = RandomForestClassifier(
    n_estimators=200,
    random_state=42,
    class_weight="balanced"
)

model.fit(
    X_train,
    y_train
)


# ============================================================
# TRAINING DATA CHECK
# ============================================================

y_pred = model.predict(X)

accuracy = accuracy_score(
    y,
    y_pred
)

print("\n================================")
print("MODEL CHECK")
print("================================")

print(
    f"Training accuracy: {accuracy * 100:.2f}%"
)

print("\nClassification Report:")

print(
    classification_report(
        y,
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
# MODEL CLASSES
# ============================================================

print("\n================================")
print("MODEL INFORMATION")
print("================================")

print(
    "Classes:",
    model.classes_
)

print(
    "Number of trees:",
    len(model.estimators_)
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

print(
    "Model saved successfully at:"
)

print(model_path)

print("\nModel features:")

for feature in features:
    print(" -", feature)