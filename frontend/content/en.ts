export const en = {
  brand: "AgriOS AI",
  tagline: "Better decisions. From soil to storage.",
  nav: [
    ["/overview", "Farm overview"],
    ["/crop-planner", "Crop Planner"],
    ["/field-monitor", "Field Monitor"],
    ["/grainguard", "GrainGuard"],
    ["/risk-center", "Risk Center"],
    ["/expert", "Expert Analytics"],
  ],
  modules: {
    "crop-planner": {
      title: "A plan rooted in your farm.",
      description:
        "Soil and weather → crop suitability → yield estimates → resource allocation.",
      phase: "Phases 2–3",
      needs:
        "Soil test, seasonal weather, validated crop models and regional cost data",
    },
    "field-monitor": {
      title: "Understand what your field needs.",
      description:
        "Validated sensor readings and weather will help identify possible water stress.",
      phase: "Phase 4",
      needs:
        "Sensor ingestion, quality checks and a clearly labeled simulated stream",
    },
    grainguard: {
      title: "Care continues after harvest.",
      description:
        "Audio features and storage conditions will support grain inspection decisions.",
      phase: "Phase 6",
      needs:
        "Labeled audio, an evaluated acoustic model and storage conditions",
    },
    "risk-center": {
      title: "The next right action.",
      description:
        "Prioritized advice will explain what happened, why, what to do and when.",
      phase: "Phase 5",
      needs: "Validated risk events and transparent prioritization",
    },
    expert: {
      title: "Every recommendation, explained.",
      description:
        "Inspect data provenance, quality, model versions and evaluation results.",
      phase: "Phases 2–7",
      needs: "Recorded predictions, sensor histories and evaluated models",
    },
  },
} as const;
