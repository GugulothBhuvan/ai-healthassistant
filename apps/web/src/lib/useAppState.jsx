// Shared app state context — v3 state model (§7)
// Manages activity_logs, medicines, documents, and derived priorities
// across Home, Trends, and Health tabs. Hydrated from /home API + local
// optimistic updates. Empty state when backend returns empty (no demo data).

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { apiFetch } from "./api.js";

const AppStateCtx = createContext(null);

export function useAppState() {
  const ctx = useContext(AppStateCtx);
  if (!ctx) throw new Error("useAppState must be inside AppStateProvider");
  return ctx;
}

// ── No demo seed data — fresh users see clean empty states ──

// ── Provider ─────────────────────────────────────────────────
export function AppStateProvider({ children }) {
  const [homeData, setHomeData] = useState(null);
  const [weekData, setWeekData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // v3 local state slices
  const [activityLogs, setActivityLogs] = useState([]);
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
  const [userName, setUserName] = useState("there");

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
      if (home.logs_today) {
        setLogsToday(home.logs_today);
        const activities = home.logs_today
          .filter(l => l.type === 'activity')
          .map(l => ({
            ts: l.ts,
            label: l.label || (l.parse && l.parse.label) || "Activity",
            minutes: (l.parse && l.parse.minutes) || 30,
            kcal_est: (l.parse && l.parse.kcal_est) || (l.parse && l.parse.kcal) || 0
          }));
        setActivityLogs(activities);
      }
      if (home.name) setUserName(home.name);

      // Hydrate kitchen if available
      if (home.kitchen) setKitchen(home.kitchen);
      // Hydrate medicines + documents from real data
      if (home.medicines) setMedicines(home.medicines);
      if (home.documents) setDocuments(home.documents);
    } catch (err) {
      console.error("AppState fetch failed:", err);
      setError("Unable to load data.");
      // Show empty state on error — no fake data
      setLoading(false);
    } finally {
      setLoading(false);
    }
  }, []);



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
