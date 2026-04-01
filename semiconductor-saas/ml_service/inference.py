"""
LightGBM inference service for semiconductor defect prediction.
Loads a pretrained model and provides prediction capabilities.
"""
import os
import pickle
import numpy as np
import logging

logger = logging.getLogger(__name__)

MODEL_PATH = os.getenv("MODEL_PATH", "/app/ml_service/lightgbm_model.pkl")


class DefectPredictor:
    """LightGBM-based defect predictor."""

    def __init__(self):
        self.model = None
        self.feature_names = None
        self.top_5_features = None
        self.top_5_metadata = None
        self.feature_medians = None
        self.imputer = None
        self._loaded = False

    def load_model(self, model_path: str = None):
        """Load the pretrained LightGBM model from disk."""
        path = model_path or MODEL_PATH
        try:
            with open(path, "rb") as f:
                model_data = pickle.load(f)

            if isinstance(model_data, dict):
                self.model = model_data.get("model")
                self.feature_names = model_data.get("feature_names", [])
                self.top_5_features = model_data.get("top_5_features", [])
                self.top_5_metadata = model_data.get("top_5_metadata", [])
                self.feature_medians = model_data.get("feature_medians", {})
                self.imputer = model_data.get("imputer", None)
            else:
                self.model = model_data
                self.feature_names = []
                self.top_5_features = []
                self.top_5_metadata = []
                self.feature_medians = {}
                self.imputer = None

            self._loaded = True
            logger.info(f"Model loaded successfully from {path}")
        except FileNotFoundError:
            logger.error(f"Model file not found at {path}")
            raise
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            raise

    @property
    def is_loaded(self) -> bool:
        return self._loaded
        
    def get_required_features(self) -> list:
        """Return the top 5 feature metadata required for prediction."""
        # Return the expanded metadata objects if available, 
        # otherwise fallback to just the strings for backwards compatibility if needed.
        if self.top_5_metadata:
            return self.top_5_metadata
        return [{"id": f, "description": f"Sensor {f.split('_')[1]} Reading", "min": 0, "max": 100} for f in self.top_5_features]

    def predict(self, feature_dict: dict) -> dict:
        """
        Run defect prediction on manual top-5 features.
        Reconstructs the full 590 feature row using stored medians.
        """
        if not self._loaded:
            raise RuntimeError("Model not loaded. Call load_model() first.")

        try:
            # Reconstruct the full feature row
            full_row = []
            for name in self.feature_names:
                if name in feature_dict:
                    full_row.append(feature_dict[name])
                else:
                    full_row.append(self.feature_medians.get(name, 0.0))

            # Convert to numpy array and shape for LightGBM
            features = np.array(full_row).reshape(1, -1)

            # Get prediction probabilities
            if hasattr(self.model, "predict_proba"):
                probabilities = self.model.predict_proba(features)
                if probabilities.ndim == 2:
                    defect_prob = float(np.mean(probabilities[:, 1]))
                else:
                    defect_prob = float(np.mean(probabilities))
            else:
                raw_preds = self.model.predict(features)
                defect_prob = float(np.mean(raw_preds))

            # Binary classification (threshold = 0.5)
            prediction_label = "DEFECT" if defect_prob >= 0.5 else "NO_DEFECT"

            # Feature importances
            importances = self._get_feature_importances()

            result = {
                "defect_probability": round(defect_prob, 6),
                "prediction_label": prediction_label,
                "feature_importances": importances,
                "num_samples": 1,
            }

            logger.info(f"Prediction complete: {prediction_label} (prob={defect_prob:.4f})")
            return result

        except Exception as e:
            logger.error(f"Prediction failed: {e}")
            raise

    def _get_feature_importances(self) -> dict:
        """Extract feature importances from the model."""
        try:
            if hasattr(self.model, "feature_importances_"):
                importances = self.model.feature_importances_
                names = self.feature_names if self.feature_names else [
                    f"feature_{i}" for i in range(len(importances))
                ]
                # Normalize importances
                total = sum(importances)
                if total > 0:
                    normalized = {
                        name: round(float(imp / total), 4)
                        for name, imp in zip(names, importances)
                    }
                else:
                    normalized = {name: 0.0 for name in names}

                # Sort by importance descending, return top 15
                sorted_imp = dict(
                    sorted(normalized.items(), key=lambda x: x[1], reverse=True)[:15]
                )
                return sorted_imp
            return {}
        except Exception as e:
            logger.warning(f"Could not extract feature importances: {e}")
            return {}


# Singleton instance
predictor = DefectPredictor()
