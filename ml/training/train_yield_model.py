import os
import json
import joblib
import logging
import pandas as pd
import numpy as np
from datetime import datetime
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.dummy import DummyRegressor
from sklearn.ensemble import RandomForestRegressor, HistGradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, root_mean_squared_error, r2_score

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

PROCESSED_DATA_PATH = os.path.join("ml", "datasets", "processed", "crop_production_cleaned.csv")
ARTIFACTS_DIR = os.path.join("ml", "artifacts")

def train_and_evaluate():
    if not os.path.exists(PROCESSED_DATA_PATH):
        logging.error("Processed data not found. Please run prepare_yield_data.py first.")
        return

    logging.info("Loading processed data...")
    df = pd.read_csv(PROCESSED_DATA_PATH)

    # Features and Target
    features = ['state', 'district', 'season', 'crop', 'crop_year', 'area']
    target = 'yield'
    
    X = df[features]
    y = df[target]

    # Time-aware split: use last 20% of chronological years for testing
    # Or simple train_test_split if years are not well distributed
    unique_years = sorted(df['crop_year'].unique())
    if len(unique_years) > 3:
        split_year_idx = int(len(unique_years) * 0.8)
        split_year = unique_years[split_year_idx]
        
        train_mask = df['crop_year'] < split_year
        test_mask = df['crop_year'] >= split_year
        
        X_train, X_test = X[train_mask], X[test_mask]
        y_train, y_test = y[train_mask], y[test_mask]
        logging.info(f"Time-aware split: Train < {split_year}, Test >= {split_year}")
    else:
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        logging.info("Used random 80/20 train-test split.")

    logging.info(f"Training set: {len(X_train)} samples. Test set: {len(X_test)} samples.")

    # Preprocessing
    # HistGradientBoosting supports categorical features natively if encoded ordinally, 
    # but OneHot is safer for RF as well if cardinality isn't insane.
    # To avoid memory explosion with high cardinality, we can use TargetEncoder or limit cardinality.
    # We will use HistGradientBoostingRegressor which is fast and supports missing values.
    # Since categorical cardinality for districts/crops is high, we can use an ordinal encoder for HistGradientBoosting 
    # or a TargetEncoder. Let's use OneHotEncoder with handle_unknown='ignore' and low frequency dropping for now.
    
    categorical_features = ['state', 'district', 'season', 'crop']
    numeric_features = ['crop_year', 'area']

    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), numeric_features),
            ('cat', OneHotEncoder(handle_unknown='ignore', min_frequency=10), categorical_features)
        ])

    models = {
        'Baseline (Median)': DummyRegressor(strategy='median'),
        'Random Forest': RandomForestRegressor(n_estimators=50, max_depth=15, random_state=42, n_jobs=-1),
        'Gradient Boosting': HistGradientBoostingRegressor(max_iter=100, random_state=42, learning_rate=0.1)
    }

    best_model = None
    best_r2 = -float('inf')
    best_name = ""
    results = {}

    for name, regressor in models.items():
        logging.info(f"Training {name}...")
        pipeline = Pipeline(steps=[('preprocessor', preprocessor), ('model', regressor)])
        
        pipeline.fit(X_train, y_train)
        y_pred = pipeline.predict(X_test)
        
        mae = mean_absolute_error(y_test, y_pred)
        rmse = root_mean_squared_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        results[name] = {'MAE': mae, 'RMSE': rmse, 'R2': r2}
        logging.info(f"{name} - MAE: {mae:.4f}, RMSE: {rmse:.4f}, R²: {r2:.4f}")
        
        # Don't pick Baseline as best model even if R2 is close
        if r2 > best_r2 and name != 'Baseline (Median)':
            best_r2 = r2
            best_model = pipeline
            best_name = name

    logging.info(f"Best model: {best_name} (R² = {best_r2:.4f})")

    # Save best model and metadata
    os.makedirs(ARTIFACTS_DIR, exist_ok=True)
    
    model_path = os.path.join(ARTIFACTS_DIR, "best_yield_model.joblib")
    joblib.dump(best_model, model_path)
    
    metadata = {
        "model_name": best_name,
        "training_date": datetime.now().isoformat(),
        "dataset_source": "data.gov.in (Crop Production in India)",
        "features": features,
        "target": target,
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "metrics": results,
        "limitations": [
            "Yield variance highly dependent on unobserved factors like weather and soil.",
            "Historical yield data may not capture future climate shifts.",
            "Area is a strong confounding factor.",
            "Target yield might include reporting errors in original dataset."
        ]
    }
    
    metadata_path = os.path.join(ARTIFACTS_DIR, "model_metadata.json")
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
        
    logging.info("Model and metadata saved successfully.")

if __name__ == "__main__":
    train_and_evaluate()
