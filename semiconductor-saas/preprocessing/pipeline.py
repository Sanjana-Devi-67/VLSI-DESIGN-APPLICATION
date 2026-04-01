"""
Preprocessing pipeline for semiconductor sensor data.
Handles: missing values, feature engineering, PCA transformation.
"""
import numpy as np
import pandas as pd
from sklearn.decomposition import PCA
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
import logging

logger = logging.getLogger(__name__)


class PreprocessingPipeline:
    """Data preprocessing pipeline matching the training-time transformations."""

    def __init__(self, n_pca_components: int = 10):
        self.n_pca_components = n_pca_components
        self.imputer = SimpleImputer(strategy="median")
        self.scaler = StandardScaler()
        self.pca = PCA(n_components=n_pca_components)
        self._is_fitted = False

    def handle_missing_values(self, df: pd.DataFrame) -> pd.DataFrame:
        """Impute missing values using median strategy."""
        logger.info(f"Handling missing values. Shape: {df.shape}")
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        if len(numeric_cols) == 0:
            raise ValueError("No numeric columns found in the data.")

        df_numeric = df[numeric_cols].copy()

        # Replace infinities with NaN
        df_numeric.replace([np.inf, -np.inf], np.nan, inplace=True)

        if self._is_fitted:
            df_numeric[:] = self.imputer.transform(df_numeric)
        else:
            df_numeric[:] = self.imputer.fit_transform(df_numeric)

        df[numeric_cols] = df_numeric
        return df

    def engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create additional features from sensor data."""
        logger.info("Engineering features...")
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()

        if len(numeric_cols) >= 2:
            # Statistical features across sensors
            df["sensor_mean"] = df[numeric_cols].mean(axis=1)
            df["sensor_std"] = df[numeric_cols].std(axis=1)
            df["sensor_min"] = df[numeric_cols].min(axis=1)
            df["sensor_max"] = df[numeric_cols].max(axis=1)
            df["sensor_range"] = df["sensor_max"] - df["sensor_min"]
            df["sensor_skew"] = df[numeric_cols].skew(axis=1)
            df["sensor_kurtosis"] = df[numeric_cols].kurtosis(axis=1)

            # Interaction features (first two sensor columns)
            col1, col2 = numeric_cols[0], numeric_cols[1]
            df["sensor_interaction_01"] = df[col1] * df[col2]
            df["sensor_ratio_01"] = df[col1] / (df[col2] + 1e-8)

        return df

    def apply_pca(self, df: pd.DataFrame) -> np.ndarray:
        """Apply PCA dimensionality reduction."""
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        data = df[numeric_cols].values

        if self._is_fitted:
            scaled = self.scaler.transform(data)
            pca_result = self.pca.transform(scaled)
        else:
            scaled = self.scaler.fit_transform(data)
            n_components = min(self.n_pca_components, data.shape[1], data.shape[0])
            self.pca = PCA(n_components=n_components)
            pca_result = self.pca.fit_transform(scaled)
            self._is_fitted = True

        logger.info(f"PCA applied. Output shape: {pca_result.shape}")
        return pca_result

    def process(self, df: pd.DataFrame) -> np.ndarray:
        """Run the full preprocessing pipeline."""
        logger.info(f"Starting preprocessing pipeline. Input shape: {df.shape}")

        # Step 1: Handle missing values
        df = self.handle_missing_values(df)

        # Step 2: Feature engineering
        df = self.engineer_features(df)

        # Step 3: PCA transformation
        processed = self.apply_pca(df)

        logger.info(f"Preprocessing complete. Output shape: {processed.shape}")
        return processed

    def get_feature_summary(self, df: pd.DataFrame) -> dict:
        """Generate a summary of the sensor data."""
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        
        def safe_float(val):
            if pd.isna(val):
                return None
            return round(float(val), 4)

        summary = {}
        for col in numeric_cols[:20]:  # Limit to first 20 columns
            summary[col] = {
                "mean": safe_float(df[col].mean()),
                "std": safe_float(df[col].std()),
                "min": safe_float(df[col].min()),
                "max": safe_float(df[col].max()),
            }
        return summary
