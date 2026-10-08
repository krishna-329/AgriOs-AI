import os
import json
import joblib
import logging
import pandas as pd
from sklearn.metrics import mean_absolute_error, root_mean_squared_error, r2_score

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

PROCESSED_DATA_PATH = os.path.join("ml", "datasets", "processed", "crop_production_cleaned.csv")
ARTIFACTS_DIR = os.path.join("ml", "artifacts")
MODEL_PATH = os.path.join(ARTIFACTS_DIR, "best_yield_model.joblib")
METADATA_PATH = os.path.join(ARTIFACTS_DIR, "model_metadata.json")

def evaluate_model():
    if not os.path.exists(MODEL_PATH) or not os.path.exists(PROCESSED_DATA_PATH):
        logging.error("Model or processed data not found. Run train_yield_model.py first.")
        return

    logging.info("Loading model and metadata...")
    model = joblib.load(MODEL_PATH)
    
    with open(METADATA_PATH, 'r') as f:
        metadata = json.load(f)
        
    logging.info(f"Loaded {metadata['model_name']} trained on {metadata['training_date']}")

    df = pd.read_csv(PROCESSED_DATA_PATH)
    X = df[metadata['features']]
    y = df[metadata['target']]

    # Evaluate on the entire dataset for granular breakdown (or just test set if we save the split)
    # For reporting by crop, let's look at the predictions
    y_pred = model.predict(X)
    
    df['predicted_yield'] = y_pred
    df['error_abs'] = abs(df['yield'] - df['predicted_yield'])
    df['error_sq'] = (df['yield'] - df['predicted_yield'])**2
    
    logging.info("\n=== Overall Evaluation ===")
    logging.info(f"MAE: {mean_absolute_error(y, y_pred):.4f}")
    logging.info(f"RMSE: {root_mean_squared_error(y, y_pred):.4f}")
    logging.info(f"R²: {r2_score(y, y_pred):.4f}")
    
    logging.info("\n=== Breakdown by Top 5 Crops ===")
    top_crops = df['crop'].value_counts().head(5).index
    for crop in top_crops:
        crop_mask = df['crop'] == crop
        if crop_mask.sum() == 0: continue
        y_c = df.loc[crop_mask, 'yield']
        p_c = df.loc[crop_mask, 'predicted_yield']
        
        c_mae = mean_absolute_error(y_c, p_c)
        c_rmse = root_mean_squared_error(y_c, p_c)
        c_r2 = r2_score(y_c, p_c)
        
        logging.info(f"Crop: {crop:15s} | N={crop_mask.sum():5d} | MAE: {c_mae:8.4f} | RMSE: {c_rmse:8.4f} | R²: {c_r2:8.4f}")

if __name__ == "__main__":
    evaluate_model()
