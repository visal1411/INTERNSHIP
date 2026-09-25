from pydantic import BaseModel
from typing import Optional

class PredictionRequest(BaseModel):
    breed: str
    age_months: float
    gender: str
    weight_kg: float

class PredictionResponse(BaseModel):
    label: str
    confidence: float
    is_anomaly: bool
    anomaly_score: float
    flag: str
    top_anomaly_driver: Optional[str] = None

