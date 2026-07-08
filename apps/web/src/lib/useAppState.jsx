// Shared app state context — v3 state model (§7)
// Manages activity_logs, medicines, documents, and derived priorities
// across Home, Trends, and Health tabs. Hydrated from /home API + local
// optimistic updates. Demo data seeds when backend returns empty.

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { apiFetch } from "./api.js";

const AppStateCtx = createContext(null);

export function useAppState() {
  const ctx = useContext(AppStateCtx);
  if (!ctx) throw new Error("useAppState must be inside AppStateProvider");
  return ctx;
}

// ── Demo seed data (prototype fallback) ──────────────────────
const DEMO_ACTIVITY_LOGS = [
  { ts: todayAt(7, 15), label: "30 min walk", minutes: 30, kcal_est: 210 },
];

const DEMO_MEDICINES = [
  { id: "med_1", name: "Vitamin D3", dose_text: "60,000 IU", schedule_text: "weekly", source: "prescription", taken_today: [true] },
  { id: "med_2", name: "Iron-folic acid", dose_text: "", schedule_text: "daily, after lunch", source: "user", taken_today: [false] },
];

const DEMO_DOCUMENTS = [
  { id: "doc_1", type: "report", title: "Blood panel", date: "2026-06-28", source_label: "Jun 28 · PDF" },
  { id: "doc_2", type: "prescription", title: "Prescription", date: "2026-07-04", source_label: "Jul 4 · snapped" },
];

const DEMO_LOGS_TODAY = [
  { id: "l1", type: "food", ts: todayAt(8, 40), parse: { food: [{ dish: "Poha and chai", size: "medium", nutrients: { calories: 320 } }] } },
  { id: "l2", type: "activity", ts: todayAt(7, 15), label: "30 min walk", kcal: 210 },
  { id: "l3", type: "prescription_snap", ts: todayAt(12, 30), label: "Prescription snapped · 2 medicines read" },
];

const DEMO_WEIGHT_HISTORY = [
  { date: "2026-04-01", kg: 59.5 },
  { date: "2026-05-01", kg: 59.0 },
  { date: "2026-06-01", kg: 58.5 },
  { date: "2026-06-15", kg: 58.2 },
  { date: "2026-07-04", kg: 58.0 },
];

const DEMO_KITCHEN = [
  { name: "chai", count: 22 },
  { name: "dal", count: 9 },
  { name: "poha", count: 7 },
  { name: "roti", count: 18 },
];

function todayAt(h, m) {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

// ── Provider ─────────────────────────────────────────────────
export function AppStateProvider({ children }) {
  const [homeData, setHomeData] = useState(null);
  const [weekData, setWeekData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // v3 local state slices
  const [activityLogs, setActivityLogs] = useState(DEMO_ACTIVITY_LOGS);
  const [medicines, setMedicines] = useState([]);          // empty until materialized
  const [documents, setDocuments] = useState([]);           // empty until materialized
  const [logsToday, setLogsToday] = useState([]);
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [weightKg, setWeightKg] = useState(null);
  const [weightHistory, setWeightHistory] = useState([]);
  const [kitchen, setKitchen] = useState([]);

  // Flags and markers (from report)
  const [flaggedMarkers, setFlaggedMarkers] = useState(null);
  const [targets, setTargets] = useState(null);
  const [intakeToday, setIntakeToday] = useState(null);
  const [proactiveLine, setProactiveLine] = useState("");
  const [diet, setDiet] = useState("vegetarian");
  const [userName, setUserName] = useState("Priya");

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [home, week] = await Promise.all([
        apiFetch("/home"),
        apiFetch("/week").catch(() => null),
      ]);
      setHomeData(home);
      setWeekData(week);

      // Hydrate from API
      if (home.targets) setTargets(home.targets);
      if (home.intake_today) {
        setIntakeToday(home.intake_today);
        setWaterGlasses(home.intake_today.water_glasses || 0);
      }
      if (home.flagged_markers) setFlaggedMarkers(home.flagged_markers);
      if (home.proactive_line) setProactiveLine(home.proactive_line);
      if (home.diet) setDiet(home.diet);
      if (home.weight_kg) setWeightKg(home.weight_kg);
      if (home.logs_today) setLogsToday(home.logs_today);
      if (home.name) setUserName(home.name);

      // Demo fallbacks for prototype
      if (!home.logs_today || home.logs_today.length === 0) {
        setLogsToday(DEMO_LOGS_TODAY);
      }
      if (!home.weight_kg) {
        setWeightKg(58);
        setWeightHistory(DEMO_WEIGHT_HISTORY);
      }
      // Seed medicines + documents for demo when report exists
      if (home.flagged_markers && home.flagged_markers.length > 0) {
        setMedicines(DEMO_MEDICINES);
        setDocuments(DEMO_DOCUMENTS);
        setKitchen(DEMO_KITCHEN);
      } else {
        setKitchen(DEMO_KITCHEN);
      }
    } catch (err) {
      console.error("AppState fetch failed:", err);
      setError("Unable to load data.");
      // Seed all demo data on error for prototype viewing
      seedAllDemo();
    } finally {
      setLoading(false);
    }
  }, []);

  function seedAllDemo() {
    setTargets({ calories: 1780, protein_g: 52, fibre_g: 30, carbs_g: 220, fat_g: 55 });
    setIntakeToday({ calories: 986, protein_g: 24, fibre_g: 8, carbs_g: 97, fat_g: 22, water_glasses: 4 });
    setWaterGlasses(4);
    setWeightKg(58);
    setWeightHistory(DEMO_WEIGHT_HISTORY);
    setFlaggedMarkers([
      { id: "iron", marker_id: "iron", value: 45, range_low: 60, range_high: 170, unit: "µg/dL", flag: "low", verdict_class: "food_fixable" },
      { id: "vitamin_d", marker_id: "vitamin_d", value: 16, range_low: 30, range_high: 100, unit: "ng/mL", flag: "low", verdict_class: "food_fixable" },
    ]);
    setLogsToday(DEMO_LOGS_TODAY);
    setActivityLogs(DEMO_ACTIVITY_LOGS);
    setMedicines(DEMO_MEDICINES);
    setDocuments(DEMO_DOCUMENTS);
    setKitchen(DEMO_KITCHEN);
    setProactiveLine("Good walk this morning. Protein's the gap now — dal would do it.");
    setDiet("vegetarian");
    setUserName("Priya");
  }

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Optimistic actions ─────────────────────────────────────
  const addWaterGlass = useCallback(() => {
    setWaterGlasses((prev) => prev + 1);
  }, []);

  const toggleMedicineTaken = useCallback((medId) => {
    setMedicines((prev) =>
      prev.map((m) =>
        m.id === medId
          ? { ...m, taken_today: m.taken_today.map((v, i) => (i === 0 ? !v : v)) }
          : m
      )
    );
  }, []);

  const addMedicine = useCallback((med) => {
    setMedicines((prev) => [...prev, { ...med, id: `med_${Date.now()}`, taken_today: [false] }]);
  }, []);

  const addDocument = useCallback((doc) => {
    setDocuments((prev) => [...prev, { ...doc, id: `doc_${Date.now()}` }]);
  }, []);

  const addLogEntry = useCallback((entry) => {
    setLogsToday((prev) => [...prev, { ...entry, id: `log_${Date.now()}`, ts: new Date().toISOString() }]);
  }, []);

  // Derived: burned kcal from activity logs
  const burnedKcal = activityLogs.reduce((sum, a) => sum + (a.kcal_est || 0), 0);

  // Derived: medicine adherence
  const medicineTakenCount = medicines.filter((m) => m.taken_today[0]).length;
  const medicineTotalCount = medicines.length;

  const value = {
    loading,
    error,
    homeData,
    weekData,
    // Core data
    targets,
    intakeToday,
    flaggedMarkers,
    proactiveLine,
    diet,
    userName,
    // Trackers
    waterGlasses,
    weightKg,
    weightHistory,
    // v3 state slices
    activityLogs,
    medicines,
    documents,
    logsToday,
    kitchen,
    // Derived
    burnedKcal,
    medicineTakenCount,
    medicineTotalCount,
    // Actions
    addWaterGlass,
    toggleMedicineTaken,
    addMedicine,
    addDocument,
    addLogEntry,
    refetch: fetchAll,
  };

  return <AppStateCtx.Provider value={value}>{children}</AppStateCtx.Provider>;
}
