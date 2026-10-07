# Model interfaces and transparency
Phase 1 defines Protocol boundaries; no inference implementation or weights are shipped.

Crop input: region, season, soil type, explicitly unit-tagged N/P/K, pH, temperature, humidity, rainfall and irrigation. Output: ranked crop identifiers, suitability score semantics, factor explanations; calibrated probability only if evaluated.
Yield input: crop, region, season, soil/weather/resource features and hectares. Output: kg/ha, total kg, prediction interval when validated. Never call an arbitrary range a statistical confidence interval.
Acoustic input: validated audio path and environmental features. Output: activity class, signal-quality status, feature summary, calibrated confidence if available. Storage risk is generated separately using moisture, humidity, temperature and duration.

All predictions persist model_name, model_version, input_features, prediction, nullable confidence, timestamp, data_sources and evaluation_status. Model artifacts must include preprocessing, feature names/units, training data version and evaluation metadata. Return service-unavailable when trained artifacts are missing; do not fabricate outputs.

Evaluation: stratified regional/season splits and leakage controls for crops; MAE/RMSE by crop/region for yield; precision/recall and false-alert rates with recording-level splits for audio. Calibration must use held-out observations. Begin with “Model evaluation pending”. Record outcomes for future evaluation; never automatically retrain from unchecked feedback.
