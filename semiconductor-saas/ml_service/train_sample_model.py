"""
Script to train a LightGBM model on the real UCI SECOM dataset.
"""
import os
import numpy as np
import pandas as pd
import pickle
import lightgbm as lgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score, accuracy_score
from sklearn.impute import SimpleImputer
from imblearn.over_sampling import SMOTE


def train_secom_model():
    """Train and save a LightGBM classifier on the real SECOM dataset."""
    print("Loading actual SECOM semiconductor sensor data...")
    
    data_path = os.path.join("secom_dataset", "secom.data")
    labels_path = os.path.join("secom_dataset", "secom_labels.data")
    
    if not os.path.exists(data_path) or not os.path.exists(labels_path):
        raise FileNotFoundError(f"SECOM dataset not found at {data_path}. Please download it first.")

    # Load data (space separated, 590 features)
    X = pd.read_csv(data_path, sep=" ", header=None)
    
    # Load labels (column 0 contains -1 for pass, 1 for fail)
    y_df = pd.read_csv(labels_path, sep=" ", header=None)
    y = np.where(y_df[0] == 1, 1, 0)  # Convert -1/1 to 0/1
    
    print(f"Original Data shape: {X.shape}")
    print(f"Original Defect rate: {y.mean():.2%}")
    
    n_features = X.shape[1]
    feature_names = [f"sensor_{i}" for i in range(n_features)]
    X.columns = feature_names

    # Impute missing values with median
    print("Imputing missing values with median...")
    imputer = SimpleImputer(strategy='median')
    X_imputed = pd.DataFrame(imputer.fit_transform(X), columns=feature_names)

    # Calculate and store medians for all features
    feature_medians = dict(zip(feature_names, imputer.statistics_))
    
    # Use SMOTE to handle class imbalance
    print("Applying SMOTE to balance the dataset...")
    smote = SMOTE(random_state=42)
    X_resampled, y_resampled = smote.fit_resample(X_imputed, y)

    print(f"Resampled Data shape: {X_resampled.shape}")
    print(f"Resampled Defect rate: {y_resampled.mean():.2%}")
    
    # Split
    X_train, X_test, y_train, y_test = train_test_split(X_resampled, y_resampled, test_size=0.2, random_state=42, stratify=y_resampled)
    
    print("Training LightGBM model on all 590 features...")
    
    model = lgb.LGBMClassifier(
        n_estimators=150,
        max_depth=5,
        learning_rate=0.05,
        num_leaves=31,
        random_state=42,
        verbose=-1,
    )
    model.fit(X_train, y_train)
    
    # Evaluate
    train_preds = model.predict(X_train)
    test_preds = model.predict(X_test)
    test_probs = model.predict_proba(X_test)[:, 1]
    
    print(f"Train Accuracy: {accuracy_score(y_train, train_preds):.4f}")
    print(f"Test Accuracy:  {accuracy_score(y_test, test_preds):.4f}")
    print(f"Test ROC AUC:   {roc_auc_score(y_test, test_probs):.4f}")

    # Feature descriptions mapping for realistic semiconductor values
    FEATURE_REAL_WORLD_PARAMS = {
        'sensor_59': { 'desc': 'Chamber Pressure (Torr)', 'min': 0.1, 'max': 150.0, 'ideal': 15.0 },
        'sensor_95': { 'desc': 'Wafer Temperature (°C)', 'min': 20.0, 'max': 1200.0, 'ideal': 650.0 },
        'sensor_486': { 'desc': 'Etching Gas Flow (sccm)', 'min': 0.0, 'max': 1000.0, 'ideal': 150.0 },
        'sensor_33': { 'desc': 'Ion Beam Current (mA)', 'min': 5.0, 'max': 50.0, 'ideal': 25.0 },
        'sensor_511': { 'desc': 'Cooling Water Flow (L/min)', 'min': 10.0, 'max': 500.0, 'ideal': 100.0 }
    }

    # Extract Top 5 Features
    importances = model.feature_importances_
    indices = np.argsort(importances)[::-1]
    top_5_indices = indices[:5]
    top_5_features = [feature_names[i] for i in top_5_indices]
    
    # Generate metadata for top 5 features with realistic values
    top_5_metadata = []
    for feat in top_5_features:
        params = FEATURE_REAL_WORLD_PARAMS.get(feat, {
            'desc': f"Sensor {feat.split('_')[1]} Reading", 
            'min': 0.0, 'max': 100.0, 'ideal': 50.0
        })
        top_5_metadata.append({
            "id": feat,
            "description": params['desc'],
            "min": params['min'],
            "max": params['max'],
            "ideal": params['ideal']
        })
        
    print(f"Top 5 most important features: {top_5_features}")

    # Save model with metadata
    model_data = {
        "model": model,
        "feature_names": feature_names,  # Keep all 590
        "n_features": n_features,
        "model_type": "LightGBM",
        "version": "2.0.0",
        "imputer": imputer,
        "top_5_features": top_5_features,
        "top_5_metadata": top_5_metadata,
        "feature_medians": feature_medians
    }

    model_path = "lightgbm_model.pkl"
    with open(model_path, "wb") as f:
        pickle.dump(model_data, f)

    print(f"Model saved to {model_path}")
    print("Done!")


if __name__ == "__main__":
    train_secom_model()

