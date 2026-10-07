export type OverviewMetric = "moisture" | "temperature" | "humidity";
export type DashboardPeriod = "Today" | "This Week" | "This Season";
export const mockFarmData = {
  source: "Mock data · Preview only",
  farmer: { name: "R. Karthikeyan", role: "Farmer", initials: "RK" },
  locations: ["Ramanathapuram, TN", "North Farm, TN"],
  health: {
    score: 82,
    change: 6,
    status: "Your farm is in good condition",
    description:
      "Crops, soil and storage conditions are stable with a few areas needing attention.",
    alerts: 2,
  },
  actions: [
    {
      id: "bin",
      title: "Inspect Grain Bin 2 today",
      reason: "Unusual acoustic activity detected.",
      level: "High",
      kind: "storage",
      why: "The example recording contains possible insect activity.",
      when: "Today",
      action: "Inspect Bin 2 and check grain condition.",
    },
    {
      id: "irrigation",
      title: "Irrigate Field 1 tomorrow morning",
      reason: "Soil moisture dropping below optimal level.",
      level: "Medium",
      kind: "water",
      why: "The mock moisture trend is declining.",
      when: "Tomorrow morning",
      action: "Check actual soil moisture, then assess irrigation needs.",
    },
    {
      id: "stress",
      title: "Monitor crop stress in North Plot",
      reason: "Early signs of crop stress detected.",
      level: "Low",
      kind: "crop",
      why: "The example crop observation needs a follow-up.",
      when: "This week",
      action: "Walk North Plot and record visible changes.",
    },
  ] as const,
  weather: {
    temperature: 28,
    condition: "Partly cloudy",
    humidity: 62,
    rainChance: 20,
    wind: "12 km/h (NE)",
    forecast: [
      { day: "Mon", date: "14 Apr", high: 28, low: 22, rain: false },
      { day: "Tue", date: "15 Apr", high: 30, low: 23, rain: false },
      { day: "Wed", date: "16 Apr", high: 29, low: 22, rain: true },
      { day: "Thu", date: "17 Apr", high: 31, low: 23, rain: false },
      { day: "Fri", date: "18 Apr", high: 32, low: 24, rain: false },
    ],
  },
  crops: [
    {
      name: "Maize",
      suitability: 92,
      tags: ["High Yield", "Good Market"],
      image: "/images/maize.jpg",
    },
    {
      name: "Red Gram",
      suitability: 78,
      tags: ["Drought Tolerant", "Soil Friendly"],
      image: "/images/red-gram.jpg",
    },
    {
      name: "Cotton",
      suitability: 71,
      tags: ["Profitable", "Moderate Water"],
      image: "/images/cotton.jpg",
    },
  ],
  resources: [
    {
      name: "Land Usage",
      value: "120 / 200 acres",
      percent: 60,
      color: "green",
      kind: "land",
    },
    {
      name: "Water Allocation",
      value: "18 / 30 million litres",
      percent: 60,
      color: "blue",
      kind: "water",
    },
    {
      name: "Fertilizer Usage",
      value: "12 / 20 tons",
      percent: 60,
      color: "amber",
      kind: "fertilizer",
    },
    {
      name: "Budget Utilization",
      value: "₹3.6 / ₹6.0 lakh",
      percent: 60,
      color: "purple",
      kind: "budget",
    },
  ],
  readings: Array.from({ length: 7 }, (_, i) => ({
    day: `${8 + i} Apr`,
    moisture: [
      { name: "Field 1", value: [42, 36, 44, 39, 49, 43, 42][i] },
      { name: "North Plot", value: [35, 22, 28, 25, 37, 26, 31][i] },
      { name: "South Plot", value: [26, 17, 21, 18, 23, 15, 21][i] },
    ],
    temperature: [
      { name: "Field 1", value: [27, 29, 30, 28, 31, 30, 28][i] },
      { name: "North Plot", value: [26, 28, 28, 27, 29, 28, 27][i] },
      { name: "South Plot", value: [28, 30, 32, 29, 33, 31, 30][i] },
    ],
    humidity: [
      { name: "Field 1", value: [62, 59, 63, 61, 66, 64, 62][i] },
      { name: "North Plot", value: [57, 53, 56, 54, 61, 57, 58][i] },
      { name: "South Plot", value: [53, 50, 54, 52, 58, 54, 55][i] },
    ],
  })),
  storage: {
    risk: "Low Risk",
    scope: "Bin 1",
    temperature: 24.8,
    moisture: 12.4,
    humidity: 58,
    activity: "Low",
    description: "No critical issues detected. Continue regular monitoring.",
  },
  risk: {
    overall: 18,
    categories: [
      { name: "Crop Risk", value: 24, color: "#f04452" },
      { name: "Resource Risk", value: 18, color: "#f5b819" },
      { name: "Field Risk", value: 12, color: "#3488f6" },
      { name: "Storage Risk", value: 8, color: "#8a65e8" },
    ],
  },
  periods: {
    Today: "Today’s snapshot · Sample date: 14 Apr 2025",
    "This Week": "Weekly snapshot · Sample period: 8–14 Apr 2025",
    "This Season": "Season preview · Mock Kharif summary",
  },
};
export type PriorityAction = (typeof mockFarmData.actions)[number];
