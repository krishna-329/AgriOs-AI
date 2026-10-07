from typing import Protocol

from app.schemas.contracts import PredictionEnvelope


class CropPredictor(Protocol):
    def predict(self, features: dict) -> PredictionEnvelope: ...


class YieldPredictor(Protocol):
    def predict(self, features: dict) -> PredictionEnvelope: ...


class AcousticClassifier(Protocol):
    def predict(self, audio_path: str, environment: dict) -> PredictionEnvelope: ...
