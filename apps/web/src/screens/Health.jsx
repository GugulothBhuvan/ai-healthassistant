// Health vault page — v3 (§5): replaces Report tab
// Markers card · Medication tracker · Documents + Body bento · Footer

import React, { useState, useEffect } from "react";
import { TOKENS } from "../tokens.js";
import { t } from "../lib/copy.js";
import { useAppState } from "../lib/useAppState.jsx";
import { useToast } from "../ui/Feedback.jsx";
import { Skeleton } from "../ui/primitives.jsx";
import ReportPage from "./ReportPage.jsx";
import {
  ChevronRight, Check, Clock, FileText, Camera,
  Plus, Download, Stethoscope, ArrowLeft, Search, Calendar, Trash2
} from "lucide-react";

// Predefined suggestion list for medications (Screen 3)
const WIDELY_USED_MEDICINES = [
  { name: "Mounjaro", ingredient: "Tirzepatide" },
  { name: "Wegovy", ingredient: "Semaglutide" },
  { name: "Ozempic", ingredient: "Semaglutide" },
  { name: "Noveltreat", ingredient: "Generic Semaglutide" },
  { name: "Sematrinity", ingredient: "Generic Semaglutide" },
  { name: "Obeda", ingredient: "Generic Semaglutide" }
];

// Predefined symptoms for Screen 2
const PREDEFINED_SYMPTOMS = [
  "Nausea", "Constipation",
  "Fatigue", "Loss of Appetite",
  "Heartburn", "Diarrhea",
  "Headache", "Vomiting"
];

export function Health({ onOpenAssistant }) {
  const state = useAppState();
  const toast = useToast();
  const [showFlags, setShowFlags] = useState(false);

  // Flow navigation state: "main" | "symptom" | "add_medicine"
  const [view, setView] = useState("main");
  const [previousView, setPreviousView] = useState("main");

  // Local storage persisted state for medication tracker flow
  const [cabinet, setCabinet] = useState(() => {
    const saved = localStorage.getItem("aarogya_cabinet");
    return saved ? JSON.parse(saved) : [
      { id: "1", name: "Ozempic", ingredient: "Semaglutide", schedule_text: "Once weekly" },
      { id: "2", name: "Mounjaro", ingredient: "Tirzepatide", schedule_text: "Once weekly" }
    ];
  });

  const [symptomsLog, setSymptomsLog] = useState(() => {
    const saved = localStorage.getItem("aarogya_symptoms_log");
    return saved ? JSON.parse(saved) : {};
  });

  const [takenDoses, setTakenDoses] = useState(() => {
    const saved = localStorage.getItem("aarogya_taken_doses");
    return saved ? JSON.parse(saved) : {};
  });

  // Active date selection for calendar slider (Screen 4)
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  // Search query for Add Medication (Screen 3)
  const [searchQuery, setSearchQuery] = useState("");

  // Temp symptoms checklist state
  const [tempCheckedSymptoms, setTempCheckedSymptoms] = useState([]);
  const [showCustomSymptomInput, setShowCustomSymptomInput] = useState(false);
  const [customSymptom, setCustomSymptom] = useState("");

  // Persist states to localStorage
  useEffect(() => {
    localStorage.setItem("aarogya_cabinet", JSON.stringify(cabinet));
  }, [cabinet]);

  useEffect(() => {
    localStorage.setItem("aarogya_symptoms_log", JSON.stringify(symptomsLog));
  }, [symptomsLog]);

  useEffect(() => {
    localStorage.setItem("aarogya_taken_doses", JSON.stringify(takenDoses));
  }, [takenDoses]);

  if (state.loading) {
    return (
      <div style={{ fontFamily: TOKENS.fonts.data, paddingBottom: "88px" }}>
        <Skeleton height={40} style={{ borderRadius: "8px", marginBottom: "16px" }} />
        <Skeleton height={200} style={{ borderRadius: TOKENS.borderRadius.card, marginBottom: "16px" }} />
        <Skeleton height={140} style={{ borderRadius: TOKENS.borderRadius.card }} />
      </div>
    );
  }

  // Show existing flags/upload screen when navigated from markers
  if (showFlags) {
    return (
      <div style={{ fontFamily: TOKENS.fonts.data, color: TOKENS.colors.ink, paddingBottom: "88px" }}>
        <button
          onClick={() => setShowFlags(false)}
          style={{
            background: "none", border: "none", fontSize: "13px", fontWeight: 500,
            color: TOKENS.colors.green, cursor: "pointer", marginBottom: "12px",
            padding: 0, fontFamily: TOKENS.fonts.data
          }}
        >
          ← Back to Health
        </button>
        <ReportPage />
      </div>
    );
  }

  const { flaggedMarkers, documents, weightKg } = state;
  const hasReport = flaggedMarkers && flaggedMarkers.length > 0;
  const hasDocuments = documents && documents.length > 0;
  const inRangeCount = hasReport ? Math.max(12, 28 - flaggedMarkers.length) : 0;

  // Calendar week helper
  const getWeekDays = () => {
    const days = [];
    const today = new Date();
    // 5 days slider centered around today
    for (let i = -2; i <= 2; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      days.push({
        dateStr: d.toISOString().split("T")[0],
        dayNum: d.getDate(),
        dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
        monthName: d.toLocaleDateString("en-US", { month: "short" })
      });
    }
    return days;
  };

  const weekDays = getWeekDays();

  // Navigation handlers
  const handleAddMedicineToCabinet = (name, ingredient) => {
    const newItem = {
      id: String(Date.now()),
      name,
      ingredient: ingredient || "Custom Medication",
      schedule_text: "Daily"
    };
    setCabinet(prev => [...prev, newItem]);
    toast(`${name} added to cabinet.`, { tone: "success" });
    setView("main");
  };

  const handleRemoveFromCabinet = (id) => {
    setCabinet(prev => prev.filter(item => item.id !== id));
    toast("Medication removed.", { tone: "info" });
  };

  const toggleDoseTaken = (medId) => {
    setTakenDoses(prev => {
      const dayDoses = prev[selectedDate] || [];
      const updated = dayDoses.includes(medId)
        ? dayDoses.filter(id => id !== medId)
        : [...dayDoses, medId];
      return { ...prev, [selectedDate]: updated };
    });
  };

  // Symptom checklist helper
  const toggleSymptomCheckbox = (symptomName) => {
    setTempCheckedSymptoms(prev =>
      prev.includes(symptomName)
        ? prev.filter(s => s !== symptomName)
        : [...prev, symptomName]
    );
  };

  const handleSaveSymptoms = () => {
    setSymptomsLog(prev => ({
      ...prev,
      [selectedDate]: tempCheckedSymptoms
    }));
    toast("Symptom log updated.", { tone: "success" });
    setView("main");
  };

  // Header render helpers
  const renderHeader = (title, showBack = false) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {showBack && (
          <button
            onClick={() => setView("main")}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", color: TOKENS.colors.green, display: "flex", alignItems: "center" }}
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <h1 style={{ fontFamily: TOKENS.fonts.assistant, fontSize: "22px", fontWeight: 500, margin: 0, color: TOKENS.colors.ink }}>
          {title}
        </h1>
      </div>
    </div>
  );

  // ── VIEW: MAIN ──
  if (view === "main") {
    const selectedDateLogs = symptomsLog[selectedDate] || [];
    const selectedDateTaken = takenDoses[selectedDate] || [];

    return (
      <div style={{ fontFamily: TOKENS.fonts.data, color: TOKENS.colors.ink, paddingBottom: "88px" }} className="a-rise">
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
          <h1 style={{ fontFamily: TOKENS.fonts.assistant, fontSize: "22px", fontWeight: 500, margin: 0, color: TOKENS.colors.ink }}>
            Health
          </h1>
        </div>
        <p style={{ fontFamily: TOKENS.fonts.assistant, fontSize: "12.5px", color: TOKENS.colors.textMuted, margin: "0 0 20px" }}>
          {t("health.subtitle")}
        </p>

        {/* Integrated Medication Tracker Card */}
        <div style={{
          background: TOKENS.colors.surface,
          border: `1px solid ${TOKENS.cardBorder}`,
          borderRadius: TOKENS.borderRadius.card,
          padding: "20px",
          boxShadow: TOKENS.shadows.card,
          marginBottom: "16px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ fontSize: "15px", fontWeight: 600, color: TOKENS.colors.ink, display: "flex", alignItems: "center", gap: "6px" }}>
              <Calendar size={18} style={{ color: TOKENS.colors.green }} />
              Medication tracker
            </div>
            <button
              onClick={() => {
                setPreviousView("main");
                setView("add_medicine");
              }}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: TOKENS.colors.green, display: "flex", alignItems: "center"
              }}
            >
              <Plus size={20} />
            </button>
          </div>

          {/* Calendar Week Slider */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "20px", justifyContent: "space-between" }}>
            {weekDays.map((day) => {
              const isSelected = selectedDate === day.dateStr;
              return (
                <div
                  key={day.dateStr}
                  onClick={() => setSelectedDate(day.dateStr)}
                  style={{
                    flex: 1, padding: "10px 4px",
                    borderRadius: "12px",
                    background: isSelected ? "#F0EFEA" : "transparent",
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                >
                  <span style={{ fontSize: "10px", color: TOKENS.colors.textMuted, display: "block", textTransform: "uppercase" }}>
                    {day.monthName}
                  </span>
                  <strong style={{ fontSize: "15px", display: "block", margin: "2px 0", color: TOKENS.colors.ink }}>
                    {day.dayNum}
                  </strong>
                  <span style={{ fontSize: "10px", color: TOKENS.colors.textMuted, display: "block" }}>
                    {day.dayName}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Today's Schedule */}
          <div style={{ marginBottom: "18px" }}>
            <h4 style={{ fontSize: "13.5px", fontWeight: 600, color: TOKENS.colors.ink, margin: "0 0 10px 0" }}>
              Today's Schedule
            </h4>
            {cabinet.length === 0 ? (
              <p style={{ fontSize: "12px", color: TOKENS.colors.textMuted, margin: 0 }}>
                No medication scheduled for this day yet.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {cabinet.map((med) => {
                  const taken = selectedDateTaken.includes(med.id);
                  return (
                    <div
                      key={med.id}
                      style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "10px 12px", border: `1px solid ${TOKENS.colors.border}`,
                        borderRadius: "10px", background: "#ffffff"
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: "13.5px", display: "block" }}>{med.name}</strong>
                        <span style={{ fontSize: "11px", color: TOKENS.colors.textMuted }}>{med.ingredient} · {med.schedule_text}</span>
                      </div>
                      <button
                        onClick={() => toggleDoseTaken(med.id)}
                        style={{
                          width: "22px", height: "22px", borderRadius: "50%",
                          border: `1.5px solid ${taken ? TOKENS.colors.green : TOKENS.colors.border}`,
                          background: taken ? TOKENS.colors.green : "transparent",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          cursor: "pointer", flexShrink: 0
                        }}
                      >
                        {taken && <Check size={12} style={{ color: "#ffffff" }} />}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Symptoms Tracked */}
          <div style={{ marginBottom: "18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <h4 style={{ fontSize: "13.5px", fontWeight: 600, color: TOKENS.colors.ink, margin: 0 }}>
                Symptoms Tracked
              </h4>
              <button
                onClick={() => {
                  setPreviousView("main");
                  setTempCheckedSymptoms(selectedDateLogs);
                  setView("symptom");
                }}
                style={{
                  background: TOKENS.colors.bg, border: `1px solid ${TOKENS.colors.border}`,
                  borderRadius: "12px", padding: "4px 10px", fontSize: "11px",
                  fontWeight: 600, color: TOKENS.colors.ink, cursor: "pointer"
                }}
              >
                Log Symptom
              </button>
            </div>

            {selectedDateLogs.length === 0 ? (
              <div style={{
                background: TOKENS.colors.bg, border: `1px dashed ${TOKENS.colors.border}`,
                borderRadius: "10px", padding: "12px", textAlign: "left"
              }}>
                <p style={{ fontSize: "11.5px", color: TOKENS.colors.textMuted, margin: 0, lineHeight: 1.4 }}>
                  No symptoms logged yet. Track symptoms to spot patterns.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {selectedDateLogs.map((sym) => (
                  <span
                    key={sym}
                    style={{
                      background: TOKENS.colors.greenSoft,
                      color: TOKENS.colors.green,
                      fontSize: "12px",
                      fontWeight: 500,
                      padding: "4px 10px",
                      borderRadius: "12px",
                      border: `1px solid ${TOKENS.colors.border}`
                    }}
                  >
                    {sym}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* My Cabinet */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <h4 style={{ fontSize: "13.5px", fontWeight: 600, color: TOKENS.colors.ink, margin: 0 }}>
                My Cabinet
              </h4>
              <button
                onClick={() => {
                  setPreviousView("main");
                  setView("add_medicine");
                }}
                style={{
                  background: TOKENS.colors.bg, border: `1px solid ${TOKENS.colors.border}`,
                  borderRadius: "12px", padding: "4px 10px", fontSize: "11px",
                  fontWeight: 600, color: TOKENS.colors.ink, cursor: "pointer"
                }}
              >
                Add Medicine
              </button>
            </div>

            {cabinet.length === 0 ? (
              <div style={{
                background: TOKENS.colors.bg, border: `1px dashed ${TOKENS.colors.border}`,
                borderRadius: "10px", padding: "12px", textAlign: "left"
              }}>
                <p style={{ fontSize: "11.5px", color: TOKENS.colors.textMuted, margin: 0, lineHeight: 1.4 }}>
                  Build your cabinet to keep track of doses and schedules in one place.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {cabinet.map((med) => (
                  <div
                    key={med.id}
                    style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "10px 12px", border: `1px solid ${TOKENS.colors.border}`,
                      borderRadius: "10px", background: "#ffffff"
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: "13.5px", display: "block" }}>{med.name}</strong>
                      <span style={{ fontSize: "11px", color: TOKENS.colors.textMuted }}>{med.ingredient}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveFromCabinet(med.id)}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        padding: "4px", color: TOKENS.colors.red
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Markers card */}
        {hasReport && (
          <div style={{
            background: TOKENS.gradients.heroCard,
            border: `1px solid ${TOKENS.heroCardBorder}`,
            borderRadius: TOKENS.borderRadius.card,
            padding: "18px 20px 14px",
            boxShadow: TOKENS.shadows.card,
            marginBottom: "16px"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "12px" }}>
              <span style={{ fontSize: "15px", fontWeight: 600, color: TOKENS.colors.ink }}>Markers</span>
              <span style={{ fontSize: "12px", color: TOKENS.colors.textFaint }}>Jun 28 panel</span>
            </div>

            {flaggedMarkers.map((marker, idx) => (
              <div
                key={marker.id || marker.marker_id}
                onClick={() => setShowFlags(true)}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 0",
                  borderTop: `1px solid ${TOKENS.colors.border}`,
                  cursor: "pointer"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "14px", fontWeight: 500, color: TOKENS.colors.ink }}>
                    {marker.marker_id.replace("_", " ").replace(/^\w/, c => c.toUpperCase())}
                  </span>
                  <span style={{
                    fontSize: "11px", fontWeight: 600, padding: "2px 8px",
                    borderRadius: "12px",
                    background: TOKENS.v3.redSoft,
                    color: TOKENS.v3.red
                  }}>
                    {marker.flag === "low" ? "Low" : "High"}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontFamily: TOKENS.fonts.assistant, fontSize: "16px", fontWeight: 500, color: TOKENS.colors.ink }}>
                    {marker.value}
                  </span>
                  <span style={{ fontSize: "12px", color: TOKENS.colors.textFaint }}>
                    · {marker.range_low}–{marker.range_high}
                  </span>
                  <ChevronRight size={14} style={{ color: TOKENS.colors.textFaint }} />
                </div>
              </div>
            ))}

            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 0 0",
              borderTop: `1px solid ${TOKENS.colors.border}`
            }}>
              <span style={{ fontSize: "13px", color: TOKENS.colors.textMuted }}>
                {inRangeCount} more in range
              </span>
              <button
                onClick={() => setShowFlags(true)}
                style={{
                  background: "none", border: "none", fontSize: "12px",
                  fontWeight: 500, color: TOKENS.colors.green, cursor: "pointer",
                  fontFamily: TOKENS.fonts.data, padding: 0
                }}
              >
                view all
              </button>
            </div>
          </div>
        )}

        {/* Bottom bento */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
          {/* Documents */}
          <div style={{
            background: TOKENS.colors.surface,
            border: `1px solid ${TOKENS.cardBorder}`,
            borderRadius: TOKENS.borderRadius.card,
            padding: "14px 16px",
            boxShadow: TOKENS.shadows.card
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <span style={{ fontSize: "13px", fontWeight: 600, color: TOKENS.colors.ink }}>Documents</span>
              <button
                onClick={() => setShowFlags(true)}
                style={{
                  background: "none", border: "none", fontSize: "12px",
                  fontWeight: 500, color: TOKENS.colors.green, cursor: "pointer",
                  fontFamily: TOKENS.fonts.data, padding: 0
                }}
              >
                + add
              </button>
            </div>

            {hasDocuments ? (
              <div>
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => { if (doc.type === "report") setShowFlags(true); }}
                    style={{
                      display: "flex", alignItems: "center", gap: "8px",
                      padding: "6px 0",
                      cursor: doc.type === "report" ? "pointer" : "default"
                    }}
                  >
                    {doc.type === "report"
                      ? <FileText size={14} style={{ color: TOKENS.colors.textFaint, flexShrink: 0 }} />
                      : <Camera size={14} style={{ color: TOKENS.colors.textFaint, flexShrink: 0 }} />
                    }
                    <div>
                      <div style={{ fontSize: "12.5px", fontWeight: 500, color: TOKENS.colors.ink }}>{doc.title}</div>
                      <div style={{ fontSize: "11px", color: TOKENS.colors.textFaint }}>{doc.source_label}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: "12px", color: TOKENS.colors.textMuted, margin: 0 }}>
                No documents yet
              </p>
            )}
          </div>

          {/* Body */}
          <div style={{
            background: TOKENS.colors.surface,
            border: `1px solid ${TOKENS.cardBorder}`,
            borderRadius: TOKENS.borderRadius.card,
            padding: "14px 16px",
            boxShadow: TOKENS.shadows.card
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "10px" }}>
              <span style={{ fontSize: "13px", fontWeight: 600, color: TOKENS.colors.ink }}>Body</span>
              <span style={{ fontSize: "11px", color: TOKENS.colors.textFaint }}>Weight</span>
            </div>

            <div style={{ fontFamily: TOKENS.fonts.assistant, fontSize: "19px", fontWeight: 500, color: TOKENS.colors.ink, marginBottom: "10px" }}>
              {weightKg ? `${weightKg} ` : "— "} <span style={{ fontSize: "14px", fontWeight: 400, color: TOKENS.colors.textMuted }}>kg</span>
            </div>

            {weightKg ? (
              <p style={{ fontSize: "11.5px", color: TOKENS.colors.textMuted, margin: 0, lineHeight: 1.45 }}>
                Current weight recorded. Add more weight entries over the coming weeks to track body trends.
              </p>
            ) : (
              <p style={{ fontSize: "11.5px", color: TOKENS.colors.textMuted, margin: 0, lineHeight: 1.45 }}>
                No weight logs recorded yet. Tap the speak button below or type to log your weight.
              </p>
            )}
          </div>
        </div>

        {/* No report invitation */}
        {!hasReport && (
          <div style={{
            background: TOKENS.colors.surface,
            border: `1px solid ${TOKENS.cardBorder}`,
            borderRadius: TOKENS.borderRadius.card,
            padding: "16px 20px",
            textAlign: "center",
            marginBottom: "20px"
          }}>
            <p style={{
              fontFamily: TOKENS.fonts.assistant,
              fontSize: "13px",
              color: TOKENS.colors.textMuted,
              margin: "0 0 12px",
              lineHeight: 1.5
            }}>
              {t("home.invitationState")}
            </p>
            <button
              onClick={() => setShowFlags(true)}
              style={{
                padding: "9px 18px",
                background: "transparent",
                color: TOKENS.colors.green,
                border: `1px solid ${TOKENS.colors.green}`,
                fontSize: "13px",
                fontWeight: 600,
                borderRadius: "10px",
                cursor: "pointer",
                fontFamily: TOKENS.fonts.data
              }}
            >
              Upload Report
            </button>
          </div>
        )}

        {/* Footer */}
        <p style={{
          fontFamily: TOKENS.fonts.assistant,
          fontSize: "11.5px",
          color: TOKENS.colors.textFaint,
          textAlign: "center",
          margin: "16px 0 0",
          lineHeight: 1.5
        }}>
          {t("health.footerPrivacy")}
        </p>
      </div>
    );
  }

  // ── VIEW: LOG SYMPTOMS (Screen 2) ──
  if (view === "symptom") {
    return (
      <div style={{ fontFamily: TOKENS.fonts.data, color: TOKENS.colors.ink, paddingBottom: "88px" }} className="a-rise">
        {renderHeader("Log symptoms", true)}

        <div style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 600, margin: "0 0 6px 0", color: TOKENS.colors.ink }}>
            How are you feeling today?
          </h2>
          <p style={{ fontSize: "13.5px", color: TOKENS.colors.textMuted, margin: 0 }}>
            Select all that apply to your current experience.
          </p>
        </div>

        {/* Symptoms checklist grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
          {PREDEFINED_SYMPTOMS.map((symptom) => {
            const isChecked = tempCheckedSymptoms.includes(symptom);
            return (
              <div
                key={symptom}
                onClick={() => toggleSymptomCheckbox(symptom)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "14px",
                  borderRadius: TOKENS.borderRadius.input || "12px",
                  border: `1px solid ${isChecked ? TOKENS.colors.green : TOKENS.colors.border}`,
                  background: isChecked ? TOKENS.colors.greenSoft : "#ffffff",
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
              >
                <div style={{
                  width: "18px", height: "18px", borderRadius: "50%",
                  border: `1.5px solid ${isChecked ? TOKENS.colors.green : TOKENS.colors.textFaint}`,
                  background: isChecked ? TOKENS.colors.green : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0
                }}>
                  {isChecked && <Check size={11} style={{ color: "#ffffff" }} />}
                </div>
                <span style={{ fontSize: "14px", fontWeight: 500, color: TOKENS.colors.ink }}>
                  {symptom}
                </span>
              </div>
            );
          })}
        </div>

        {/* Add custom symptom input */}
        <div style={{ marginBottom: "28px" }}>
          {!showCustomSymptomInput ? (
            <button
              onClick={() => setShowCustomSymptomInput(true)}
              style={{
                width: "100%", padding: "14px", background: TOKENS.colors.bg,
                border: `1.5px dashed ${TOKENS.colors.border}`, borderRadius: "12px",
                color: TOKENS.colors.ink, fontSize: "13.5px", fontWeight: 600,
                cursor: "pointer", textAlign: "center"
              }}
            >
              + Other symptoms
            </button>
          ) : (
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                value={customSymptom}
                onChange={(e) => setCustomSymptom(e.target.value)}
                placeholder="Type your symptom..."
                style={{
                  flex: 1, padding: "12px", border: `1px solid ${TOKENS.colors.border}`,
                  borderRadius: "12px", fontSize: "14px", outline: "none", background: "#ffffff"
                }}
              />
              <button
                onClick={() => {
                  if (customSymptom.trim()) {
                    setTempCheckedSymptoms(prev => [...prev, customSymptom.trim()]);
                    setCustomSymptom("");
                    setShowCustomSymptomInput(false);
                  }
                }}
                style={{
                  padding: "12px 18px", background: TOKENS.colors.green, color: "#ffffff",
                  border: "none", borderRadius: "12px", fontWeight: 600, cursor: "pointer"
                }}
              >
                Add
              </button>
            </div>
          )}
        </div>

        {/* Continue Button */}
        <button
          onClick={handleSaveSymptoms}
          style={{
            width: "100%", padding: "14px",
            background: "#B3C8BE", // Muted light green matching Continue button
            color: "#ffffff", border: "none",
            borderRadius: TOKENS.borderRadius.pill || "24px",
            fontSize: "15px", fontWeight: 600, cursor: "pointer",
            textAlign: "center"
          }}
        >
          Continue
        </button>
      </div>
    );
  }

  // ── VIEW: ADD MEDICATION (Screen 3) ──
  if (view === "add_medicine") {
    // Filter suggestions based on search
    const filteredMedicines = WIDELY_USED_MEDICINES.filter(
      med => med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             med.ingredient.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div style={{ fontFamily: TOKENS.fonts.data, color: TOKENS.colors.ink, paddingBottom: "88px" }} className="a-rise">
        {renderHeader("Add Medication", true)}

        <p style={{ fontSize: "14px", color: TOKENS.colors.textMuted, margin: "0 0 10px 0" }}>
          Search or add your medication
        </p>

        {/* Search input field */}
        <div style={{ position: "relative", marginBottom: "20px" }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search medications..."
            style={{
              width: "100%", padding: "14px 16px 14px 40px",
              border: `1px solid ${TOKENS.colors.border}`, borderRadius: "12px",
              fontSize: "14px", outline: "none", boxSizing: "border-box", background: "#ffffff"
            }}
          />
          <Search size={18} style={{ position: "absolute", left: "14px", top: "15px", color: TOKENS.colors.textFaint }} />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "14px" }}>
          <span style={{ fontSize: "11px", fontWeight: 600, color: TOKENS.colors.textFaint, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            WIDELY USED
          </span>
          <span style={{ fontSize: "11px", color: TOKENS.colors.textMuted, fontWeight: 500 }}>
            Top Suggestions
          </span>
        </div>

        {/* Suggestion list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
          {filteredMedicines.map((med) => (
            <div
              key={med.name}
              style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "14px 16px", border: `1px solid ${TOKENS.colors.border}`,
                borderRadius: "12px", background: "#ffffff"
              }}
            >
              <div>
                <strong style={{ fontSize: "15px", display: "block", color: TOKENS.colors.ink }}>{med.name}</strong>
                <span style={{ fontSize: "12px", color: TOKENS.colors.textMuted }}>{med.ingredient}</span>
              </div>
              <button
                onClick={() => handleAddMedicineToCabinet(med.name, med.ingredient)}
                style={{
                  width: "28px", height: "28px", borderRadius: "50%",
                  border: `1px solid ${TOKENS.colors.border}`, background: "#ffffff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", color: TOKENS.colors.ink
                }}
              >
                <Plus size={16} />
              </button>
            </div>
          ))}
        </div>

        {/* Custom addition button */}
        {searchQuery.trim() && (
          <button
            onClick={() => handleAddMedicineToCabinet(searchQuery.trim(), "Custom Medication")}
            style={{
              width: "100%", padding: "14px",
              background: "#B3C8BE", // matching Screen 3 bottom button style
              color: "#ffffff", border: "none",
              borderRadius: TOKENS.borderRadius.pill || "24px",
              fontSize: "14px", fontWeight: 600, cursor: "pointer",
              textAlign: "center"
            }}
          >
            Add Medicine
          </button>
        )}
      </div>
    );
  }
}

export default Health;
