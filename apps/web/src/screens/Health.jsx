// Health vault page — v3 (§5): replaces Report tab
// Markers card · Medicines & supplements · Documents + Body bento · Footer

import React, { useState } from "react";
import { TOKENS } from "../tokens.js";
import { t } from "../lib/copy.js";
import { useAppState } from "../lib/useAppState.jsx";
import { useToast } from "../ui/Feedback.jsx";
import { Skeleton } from "../ui/primitives.jsx";
import ReportPage from "./ReportPage.jsx";
import {
  ChevronRight, Check, Clock, FileText, Camera,
  Plus, Download, Stethoscope
} from "lucide-react";

export function Health({ onOpenAssistant }) {
  const state = useAppState();
  const toast = useToast();
  const [showFlags, setShowFlags] = useState(false);

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

  const {
    flaggedMarkers, medicines, documents,
    weightKg, weightHistory,
    toggleMedicineTaken
  } = state;

  const hasReport = flaggedMarkers && flaggedMarkers.length > 0;
  const hasMedicines = medicines && medicines.length > 0;
  const hasDocuments = documents && documents.length > 0;

  // Compute in-range count (demo: 22)
  const inRangeCount = 22;

  return (
    <div style={{ fontFamily: TOKENS.fonts.data, color: TOKENS.colors.ink, paddingBottom: "88px" }}>
      <style>{`
        @keyframes aRise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .a-rise { animation: aRise 0.5s cubic-bezier(0.16,1,0.3,1) both; }
      `}</style>

      {/* ── Header ── */}
      <div className="a-rise" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
        <h1 style={{ fontFamily: TOKENS.fonts.assistant, fontSize: "22px", fontWeight: 500, margin: 0, color: TOKENS.colors.ink }}>
          Health
        </h1>
        <button
          onClick={() => toast(t("toast.summaryReady"), { tone: "success" })}
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            background: TOKENS.colors.greenSoft,
            color: TOKENS.colors.green,
            border: "none", borderRadius: "20px",
            padding: "6px 14px", fontSize: "12px", fontWeight: 500,
            cursor: "pointer", fontFamily: TOKENS.fonts.data
          }}
        >
          <Stethoscope size={14} />
          Doctor summary
        </button>
      </div>
      <p style={{ fontFamily: TOKENS.fonts.assistant, fontSize: "12.5px", color: TOKENS.colors.textMuted, margin: "0 0 20px" }}>
        {t("health.subtitle")}
      </p>

      {/* ── 5.1 Markers card ── */}
      {hasReport && (
        <div className="a-rise" style={{
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

          {/* Footer: in-range count */}
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

      {/* ── 5.2 Medicines & supplements ── */}
      {hasMedicines && (
        <div className="a-rise" style={{
          background: TOKENS.colors.surface,
          border: `1px solid ${TOKENS.cardBorder}`,
          borderRadius: TOKENS.borderRadius.card,
          padding: "18px 20px 14px",
          boxShadow: TOKENS.shadows.card,
          marginBottom: "16px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "15px", fontWeight: 600, color: TOKENS.colors.ink }}>Medicines & supplements</span>
            <button
              onClick={() => onOpenAssistant("text", "e.g. snap your prescription or type the medicine")}
              style={{
                background: "none", border: "none", fontSize: "12px",
                fontWeight: 500, color: TOKENS.colors.green, cursor: "pointer",
                fontFamily: TOKENS.fonts.data, padding: 0
              }}
            >
              + add
            </button>
          </div>

          {medicines.map((med) => {
            const taken = med.taken_today && med.taken_today[0];
            return (
              <div
                key={med.id}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 0",
                  borderTop: `1px solid ${TOKENS.colors.border}`
                }}
              >
                <div>
                  <div style={{ fontSize: "12.5px", fontWeight: 500, color: TOKENS.colors.ink }}>
                    {med.name}{med.dose_text ? ` · ${med.dose_text}` : ""}
                  </div>
                  <div style={{ fontSize: "11px", color: TOKENS.colors.textFaint, marginTop: "2px" }}>
                    {med.schedule_text} · {med.source === "prescription" ? t("home.fromPrescription") : t("home.youAddedThis")}
                  </div>
                </div>
                <button
                  onClick={() => { toggleMedicineTaken(med.id); toast(t("toast.noted"), { tone: "success" }); }}
                  style={{
                    width: "26px", height: "26px", borderRadius: "8px",
                    background: taken ? TOKENS.colors.greenSoft : TOKENS.colors.surface,
                    border: taken ? "none" : `1px solid ${TOKENS.colors.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", flexShrink: 0
                  }}
                >
                  {taken
                    ? <Check size={14} style={{ color: TOKENS.colors.green }} />
                    : <Clock size={12} style={{ color: TOKENS.colors.amber }} />
                  }
                </button>
              </div>
            );
          })}

          {/* Disclaimer */}
          <p style={{
            fontFamily: TOKENS.fonts.assistant,
            fontSize: "11px",
            color: TOKENS.colors.textFaint,
            margin: "12px 0 0",
            lineHeight: 1.5
          }}>
            {t("health.medicineDisclaimer")}
          </p>
        </div>
      )}

      {/* ── 5.3 Bottom bento ── */}
      <div className="a-rise" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
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
            <span style={{ fontSize: "11px", color: TOKENS.colors.textFaint }}>90 days</span>
          </div>

          <div style={{ fontFamily: TOKENS.fonts.assistant, fontSize: "19px", fontWeight: 500, color: TOKENS.colors.ink, marginBottom: "10px" }}>
            {weightKg || "—"} <span style={{ fontSize: "14px", fontWeight: 400, color: TOKENS.colors.textMuted }}>kg</span>
          </div>

          {/* 5-bar mini weight trend */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height: "36px", marginBottom: "8px" }}>
            {["#CFE0D8", "#CFE0D8", "#9CC0B1", "#5E9481", "#17594A"].map((color, i) => {
              const h = [40, 50, 60, 75, 90];
              return (
                <div
                  key={i}
                  style={{
                    flex: 1, height: `${h[i]}%`, borderRadius: "3px 3px 1px 1px",
                    background: color, transition: "height 0.4s ease"
                  }}
                />
              );
            })}
          </div>

          <p style={{ fontSize: "11px", color: TOKENS.colors.textFaint, margin: 0 }}>
            −1.5 kg since April
          </p>
        </div>
      </div>

      {/* ── No report invitation ── */}
      {!hasReport && (
        <div className="a-rise" style={{
          background: TOKENS.colors.greenSoft,
          borderRadius: TOKENS.borderRadius.card,
          padding: "20px",
          textAlign: "center",
          marginBottom: "20px"
        }}>
          <p style={{
            fontFamily: TOKENS.fonts.assistant,
            fontSize: "14px",
            color: TOKENS.colors.ink,
            margin: "0 0 14px",
            lineHeight: 1.5
          }}>
            {t("home.invitationState")}
          </p>
          <button
            onClick={() => setShowFlags(true)}
            className="aa-btn"
            style={{
              padding: "10px 20px",
              background: TOKENS.colors.green,
              color: "#fff",
              fontSize: "13px",
              fontWeight: 600,
              borderRadius: "10px"
            }}
          >
            Upload Report
          </button>
        </div>
      )}

      {/* ── Footer ── */}
      <p className="a-rise" style={{
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

export default Health;
