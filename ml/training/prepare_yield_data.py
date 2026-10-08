import os
import pandas as pd
import numpy as np
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

RAW_DATA_PATH = os.path.join("ml", "datasets", "raw", "crop_production.csv")
PROCESSED_DATA_PATH = os.path.join("ml", "datasets", "processed", "crop_production_cleaned.csv")

def clean_data():
    if not os.path.exists(RAW_DATA_PATH):
        logging.error(f"Raw dataset not found at {RAW_DATA_PATH}")
        logging.error("Please download the 'Crop Production in India' dataset from data.gov.in and save it as crop_production.csv in ml/datasets/raw/")
        return False

    logging.info(f"Loading raw data from {RAW_DATA_PATH}...")
    df = pd.read_csv(RAW_DATA_PATH)
    
    # Standardize column names if needed
    col_mapping = {
        'State_Name': 'state',
        'District_Name': 'district',
        'Crop_Year': 'crop_year',
        'Season': 'season',
        'Crop': 'crop',
        'Area': 'area',
        'Production': 'production'
    }
    # Rename columns that exist in the mapping (case insensitive matching)
    df.columns = df.columns.str.strip()
    rename_dict = {}
    for col in df.columns:
        for k, v in col_mapping.items():
            if col.lower() == k.lower():
                rename_dict[col] = v
    df.rename(columns=rename_dict, inplace=True)
    
    # Ensure required columns are present
    required_cols = ['state', 'district', 'crop_year', 'season', 'crop', 'area', 'production']
    missing_cols = [c for c in required_cols if c not in df.columns]
    if missing_cols:
        logging.error(f"Missing required columns in dataset: {missing_cols}")
        return False

    initial_len = len(df)
    logging.info(f"Initial record count: {initial_len}")

    # Drop duplicates
    df.drop_duplicates(inplace=True)
    
    # Drop rows with missing values in critical columns
    df.dropna(subset=['area', 'production', 'crop', 'season', 'state', 'district'], inplace=True)
    
    # Convert to numeric, forcing errors to NaN, then drop NaNs
    df['area'] = pd.to_numeric(df['area'], errors='coerce')
    df['production'] = pd.to_numeric(df['production'], errors='coerce')
    df.dropna(subset=['area', 'production'], inplace=True)

    # Filter out invalid area and production
    df = df[(df['area'] > 0) & (df['production'] > 0)]
    
    # Text standardization
    for col in ['state', 'district', 'season', 'crop']:
        df[col] = df[col].astype(str).str.strip().str.title()
    
    # Calculate target: Yield (Production / Area)
    df['yield'] = df['production'] / df['area']
    
    # Remove extreme outliers in yield (e.g., coconut might be in nuts, some might be in tonnes, some might be wildly wrong)
    # Using IQR method per crop to remove crazy outliers
    def remove_outliers(group):
        Q1 = group['yield'].quantile(0.05)
        Q3 = group['yield'].quantile(0.95)
        IQR = Q3 - Q1
        return group[(group['yield'] >= (Q1 - 1.5 * IQR)) & (group['yield'] <= (Q3 + 1.5 * IQR))]

    df = df.groupby('crop', group_keys=False).apply(remove_outliers)

    final_len = len(df)
    logging.info(f"Records after cleaning: {final_len} (Dropped {initial_len - final_len} records)")

    # Save processed data
    os.makedirs(os.path.dirname(PROCESSED_DATA_PATH), exist_ok=True)
    df.to_csv(PROCESSED_DATA_PATH, index=False)
    logging.info(f"Cleaned dataset saved to {PROCESSED_DATA_PATH}")
    return True

if __name__ == "__main__":
    clean_data()
