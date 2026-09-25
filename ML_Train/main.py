import os
import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from models import PredictionRequest, PredictionResponse

app = FastAPI(title="ML Train Service")

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")
bundle = None

@app.on_event("startup")
def load_model():
    global bundle
    if os.path.exists(MODEL_PATH):
        bundle = joblib.load(MODEL_PATH)
        print("Model bundle loaded successfully.")
    else:
        print(f"Warning: Model not found at {MODEL_PATH}. Run train.py first.")

def get_age_group(age_months: float) -> str:
    bins = [0, 12, 24, 36, 48, 60, np.inf]
    labels = ["0-12", "13-24", "25-36", "37-48", "49-60", "60+"]
    idx = np.digitize([age_months], bins, right=True)[0] - 1
    idx = max(0, min(idx, len(labels) - 1))
    return labels[idx]

def refine_flag(is_anomaly: bool, z_score: float, gender: str) -> str:
    if not is_anomaly:
        return "Normal"
    if z_score < 0:
        return "Flagged - Potential Sickness"
    return "Flagged - Possible Pregnancy or Overweight" if gender.title() == "Female" else "Flagged - Unusual, Needs Review"

@app.post("/predict", response_model=PredictionResponse)
def predict(req: PredictionRequest):
    if bundle is None:
        raise HTTPException(status_code=503, detail="Model not loaded. Run train.py first.")

    try:
        breed = req.breed.strip().title()
        gender = req.gender.strip().title()
        age_group = get_age_group(req.age_months)

        # 1. Cohort Z-Score calculation
        cs = bundle["cohort_stats"]
        row = cs[(cs["Breed"] == breed) & (cs["Gender"] == gender) & (cs["AgeGroup"] == age_group)]
        
        if not row.empty:
            c_mean = float(row.iloc[0]["CohortMeanWeight"])
            c_std = float(row.iloc[0]["CohortStdWeight"])
        else:
            c_mean = float(bundle["global_mean"])
            c_std = float(bundle["global_std"])

        z_score = (req.weight_kg - c_mean) / (c_std if c_std > 0 else 1e-6)

        # Categorical Encodings
        try:
            b_enc = int(bundle["le_breed"].transform([breed])[0])
        except Exception:
            b_enc = 0
        try:
            g_enc = int(bundle["le_gender"].transform([gender])[0])
        except Exception:
            g_enc = 0

        # 2. Stage 1: Isolation Forest
        iso_features = pd.DataFrame([{
            "Breed_enc": b_enc,
            "Gender_enc": g_enc,
            "Age": req.age_months,
            "Weight_Zscore": z_score
        }])

        anomaly_score = float(bundle["iso_forest"].decision_function(iso_features)[0])
        is_anomaly = bool(bundle["iso_forest"].predict(iso_features)[0] == -1)
        flag = refine_flag(is_anomaly, z_score, gender)

        top_driver = None
        if is_anomaly:
            try:
                shap_vals = bundle["explainer"].shap_values(iso_features)[0]
                feature_names = ["Breed_enc", "Gender_enc", "Age", "Weight_Zscore"]
                min_idx = int(np.argmin(shap_vals))
                top_driver = feature_names[min_idx]
            except Exception:
                top_driver = "Weight_Zscore"

        # 3. Stage 2: Decision Tree Classifier
        dt_features = pd.DataFrame([{
            "Breed_enc": b_enc,
            "Gender_enc": g_enc,
            "Age": req.age_months,
            "Weight": req.weight_kg
        }])

        label = str(bundle["clf"].predict(dt_features)[0]).lower()
        probs = bundle["clf"].predict_proba(dt_features)[0]
        confidence = float(np.max(probs))

        return PredictionResponse(
            label=label,
            confidence=confidence,
            is_anomaly=is_anomaly,
            anomaly_score=anomaly_score,
            flag=flag,
            top_anomaly_driver=top_driver
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

