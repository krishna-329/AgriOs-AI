# Dataset intake
No public dataset has been downloaded or verified for this foundation. Dataset/model work begins in Phase 2; no accuracy claims are made.

Every modular loader must produce a manifest: source URL, license, retrieved date, file hash, geography, temporal coverage, feature units, label meaning, missing-value policy and split strategy. Separate raw files from validated training tables. Check regional coverage and leakage before use.

Required sources: crop/soil suitability, historical crop yields with area and units, local weather/forecast provider, and labeled stored-grain insect audio with negatives/background noise. Generic insect sounds are not automatically valid stored-grain training evidence.

External weather failures remain unavailable, never quietly replaced by simulated weather. Historical replay retains original observed_at and replayed_at. Simulated IoT Data is identified in the payload, database and UI.
