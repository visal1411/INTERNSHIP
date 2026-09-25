import os
import joblib
import numpy as np
import pandas as pd
import shap
from sklearn.ensemble import IsolationForest
from sklearn.tree import DecisionTreeClassifier
from sklearn.preprocessing import LabelEncoder

AGE_BINS = [0, 12, 24, 36, 48, 60, np.inf]
AGE_LABELS = ["0-12", "13-24", "25-36", "37-48", "49-60", "60+"]

def train():
    data_path = os.path.join(os.path.dirname(__file__), "cattle_dataset.csv")
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Dataset not found at {data_path}")

    print(f"Loading dataset from {data_path}...")
    # Load tab-delimited dataset
    try:
        df = pd.read_csv(data_path, sep='\t')
    except Exception:
        df = pd.read_csv(data_path)


    # Clean column names
    df.columns = [c.strip() for c in df.columns]

    # Required columns check
    req_cols = {"Breed", "Age", "Gender", "Weight"}
    if not req_cols.issubset(set(df.columns)):
        raise ValueError(f"Dataset missing required columns. Found: {list(df.columns)}")

    # Target column check (Label or Status)
    if "Status" not in df.columns and "Label" in df.columns:
        df["Status"] = df["Label"]
    
    # Normalize 'Normal' -> 'Healthy' and standardize strings
    df["Status"] = df["Status"].astype(str).str.strip().replace({"Normal": "Healthy"}).str.lower()
    df["Breed"] = df["Breed"].astype(str).str.strip().str.title()
    df["Gender"] = df["Gender"].astype(str).str.strip().str.title()
    df["Age"] = pd.to_numeric(df["Age"], errors='coerce')
    df["Weight"] = pd.to_numeric(df["Weight"], errors='coerce')

    df = df.dropna(subset=["Breed", "Gender", "Age", "Weight", "Status"]).copy()

    print(f"Dataset shape after preprocessing: {df.shape}")

    # 1. Cohort Statistics
    df["AgeGroup"] = pd.cut(df["Age"], bins=AGE_BINS, labels=AGE_LABELS, right=True)
    cohort_stats = (
        df.groupby(["Breed", "Gender", "AgeGroup"], observed=True)["Weight"]
        .agg(["mean", "std"])
        .rename(columns={"mean": "CohortMeanWeight", "std": "CohortStdWeight"})
        .reset_index()
    )
    cohort_stats["CohortStdWeight"] = cohort_stats["CohortStdWeight"].fillna(0).replace(0, 1e-6)

    df = df.merge(cohort_stats, on=["Breed", "Gender", "AgeGroup"], how="left")
    df["Weight_Zscore"] = (df["Weight"] - df["CohortMeanWeight"]) / df["CohortStdWeight"]

    # 2. Label Encoders
    le_breed = LabelEncoder().fit(df["Breed"])
    le_gender = LabelEncoder().fit(df["Gender"])

    # 3. Isolation Forest
    iso_features = pd.DataFrame({
        "Breed_enc": le_breed.transform(df["Breed"]),
        "Gender_enc": le_gender.transform(df["Gender"]),
        "Age": df["Age"],
        "Weight_Zscore": df["Weight_Zscore"],
    })

    print("Fitting Isolation Forest...")
    iso_forest = IsolationForest(n_estimators=300, contamination=0.06, random_state=42)
    iso_forest.fit(iso_features)

    print("Fitting SHAP TreeExplainer...")
    explainer = shap.TreeExplainer(iso_forest)

    # 4. Decision Tree Classifier
    dt_features = pd.DataFrame({
        "Breed_enc": le_breed.transform(df["Breed"]),
        "Gender_enc": le_gender.transform(df["Gender"]),
        "Age": df["Age"],
        "Weight": df["Weight"]
    })

    print("Fitting Decision Tree Classifier...")
    clf = DecisionTreeClassifier(max_depth=5, random_state=42)
    clf.fit(dt_features, df["Status"])

    acc = clf.score(dt_features, df["Status"])
    print(f"Decision Tree Training Accuracy: {acc:.2%}")

    # 5. Save model bundle
    model_bundle = {
        "iso_forest": iso_forest,
        "explainer": explainer,
        "clf": clf,
        "cohort_stats": cohort_stats,
        "le_breed": le_breed,
        "le_gender": le_gender,
        "global_mean": float(df["Weight"].mean()),
        "global_std": float(df["Weight"].std() or 1.0)
    }

    model_path = os.path.join(os.path.dirname(__file__), "model.pkl")
    print(f"Saving dual-model bundle to {model_path}...")
    joblib.dump(model_bundle, model_path)
    print("Done!")

if __name__ == "__main__":
    train()

