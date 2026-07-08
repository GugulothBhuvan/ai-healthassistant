// Home screen — v3 rebuild (§3)
// Order: header → daily line → Today hero → Priorities → Tracker tiles → Logged today

import React, { useState } from "react";
import { TOKENS } from "../tokens.js";
import { t } from "../lib/copy.js";
import { useAppState } from "../lib/useAppState.jsx";
import { useToast } from "../ui/Feedback.jsx";
import { Skeleton } from "../ui/primitives.jsx";
import {
  Camera, Plus, Droplet, Footprints, Scale, Check,
  UtensilsCrossed, Bike, CameraIcon, ChevronRight
} from "lucide-react";

// ── Helper: greeting by time of day ──
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function formatDate() {
  return new Date().toLocaleDateString("en-IN", { weekday: "long", month: "short", day: "numeric" });
}

// ── Main ─────────────────────────────────────────────────────
export function Home({ onOpenAssistant, onNavigateToHealth }) {
  const state = useAppState();
  const toast = useToast();

  if (state.loading) {
    return (
      <div style={{ fontFamily: TOKENS.fonts.data, paddingBottom: "88px" }} aria-busy="true">
        <Skeleton height={80} style={{ borderRadius: TOKENS.borderRadius.card, marginBottom: "16px" }} />
        <Skeleton height={56} style={{ borderRadius: "12px", marginBottom: "16px" }} />
        <Skeleton height={180} style={{ borderRadius: TOKENS.borderRadius.card, marginBottom: "16px" }} />
        <Skeleton height={100} style={{ borderRadius: TOKENS.borderRadius.card }} />
      </div>
    );
  }

  const {
    targets, intakeToday, flaggedMarkers, proactiveLine, userName,
    waterGlasses, weightKg, burnedKcal, activityLogs,
    medicines, medicineTakenCount, medicineTotalCount,
    logsToday, addWaterGlass, toggleMedicineTaken,
  } = state;

  const hasReport = flaggedMarkers && flaggedMarkers.length > 0;
  const hasMedicines = medicines && medicines.length > 0;
  const caloriesIn = intakeToday?.calories || 0;
  const targetCal = targets?.calories || 1780;

  // Macro percentages
  const macros = [
    { label: "Protein", current: intakeToday?.protein_g || 0, target: targets?.protein_g || 52, pct: 0 },
    { label: "Carbs",   current: intakeToday?.carbs_g || 0,   target: targets?.carbs_g || 220,  pct: 0 },
    { label: "Fat",     current: intakeToday?.fat_g || 0,     target: targets?.fat_g || 55,     pct: 0 },
    { label: "Fibre",   current: intakeToday?.fibre_g || 0,   target: targets?.fibre_g || 30,   pct: 0 },
  ];
  macros.forEach((m) => { m.pct = m.target > 0 ? Math.round((m.current / m.target) * 100) : 0; });

  // Activity tile label
  const latestActivity = activityLogs && activityLogs.length > 0
    ? activityLogs[activityLogs.length - 1]
    : null;

  return (
    <div style={{ fontFamily: TOKENS.fonts.data, color: TOKENS.colors.ink, paddingBottom: "88px" }}>
      <style>{`
        @keyframes aRise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .a-rise { animation: aRise 0.5s cubic-bezier(0.16,1,0.3,1) both; }
      `}</style>

      {/* ── 3.1 HEADER ROW ── */}
      <div className="a-rise" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
        <div>
          <div style={{ fontSize: "12px", color: TOKENS.colors.textMuted, marginBottom: "2px" }}>
            {formatDate()}
          </div>
          <h1 style={{
            fontFamily: TOKENS.fonts.assistant,
            fontSize: "26px",
            fontWeight: 500,
            letterSpacing: "-0.5px",
            margin: 0,
            color: TOKENS.colors.ink
          }}>
            {getGreeting()}, {userName}
          </h1>
        </div>
        <div style={{
          width: "38px", height: "38px", borderRadius: "50%",
          background: TOKENS.colors.greenSoft,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: TOKENS.fonts.assistant,
          fontSize: "18px", fontWeight: 500, color: TOKENS.colors.green,
          flexShrink: 0
        }}>
          {(userName || "P").charAt(0)}
        </div>
      </div>

      {/* ── 3.2 DAILY LINE ── */}
      {proactiveLine && (
        <div className="a-rise" style={{
          display: "flex", gap: "12px", alignItems: "stretch",
          background: "linear-gradient(90deg, rgba(23,89,74,0.07), transparent)",
          borderRadius: "12px",
          padding: "10px 12px",
          marginBottom: "16px"
        }}>
          <div style={{
            width: "3px", flexShrink: 0, borderRadius: "2px",
            background: `linear-gradient(180deg, ${TOKENS.colors.green}, ${TOKENS.colors.amber})`
          }} />
          <p style={{
            fontFamily: TOKENS.fonts.assistant,
            fontSize: "13px",
            color: TOKENS.colors.ink,
            opacity: 0.85,
            margin: 0,
            lineHeight: 1.5
          }}>
            {proactiveLine}
          </p>
        </div>
      )}

      {/* ── 3.3 TODAY HERO CARD ── */}
      <div className="a-rise" style={{
        background: TOKENS.gradients.heroCard,
        border: `1px solid ${TOKENS.heroCardBorder}`,
        borderRadius: TOKENS.borderRadius.card,
        padding: "18px 20px 16px",
        boxShadow: TOKENS.shadows.card,
        marginBottom: "20px"
      }}>
        {/* Row 1: Title + quick actions */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <span style={{ fontSize: "13.5px", fontWeight: 600, color: TOKENS.colors.ink }}>Today</span>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              id="btn-camera"
              onClick={() => onOpenAssistant("camera")}
              style={quickActionBtnStyle}
              aria-label="Camera"
            >
              <Camera size={15} style={{ color: TOKENS.colors.ink }} />
            </button>
            <button
              id="btn-add"
              onClick={() => onOpenAssistant("text")}
              style={quickActionBtnStyle}
              aria-label="Add"
            >
              <Plus size={15} style={{ color: TOKENS.colors.ink }} />
            </button>
          </div>
        </div>

        {/* Row 2: Numerals */}
        <div style={{ display: "flex", alignItems: "baseline", gap: "16px", marginBottom: "14px" }}>
          <div>
            <span style={{ fontFamily: TOKENS.fonts.assistant, fontSize: "30px", fontWeight: 500, color: TOKENS.colors.green }}>{caloriesIn}</span>
            <span style={{ fontSize: "12px", color: TOKENS.colors.textMuted, marginLeft: "4px" }}>in</span>
          </div>
          {burnedKcal > 0 && (
            <div>
              <span style={{ fontFamily: TOKENS.fonts.assistant, fontSize: "19px", fontWeight: 500, color: TOKENS.colors.amber }}>{burnedKcal}</span>
              <span style={{ fontSize: "12px", color: TOKENS.colors.textMuted, marginLeft: "4px" }}>burned</span>
            </div>
          )}
          <span style={{ fontSize: "12px", color: TOKENS.colors.textFaint, marginLeft: "auto" }}>target {targetCal.toLocaleString()}</span>
        </div>

        {/* Row 3: Macro mini bars (2x2 grid similar to HealthifyMe) */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 20px" }}>
          {macros.map((m) => {
            const fill = m.pct >= 35 ? TOKENS.colors.green : TOKENS.colors.amber;
            const displayLabel = m.label === "Carbs" ? "Carb" : m.label;
            return (
              <div key={m.label}>
                <div style={{ display: "flex", alignItems: "baseline", marginBottom: "4px", fontSize: "11px", color: TOKENS.colors.textMuted }}>
                  <span>{displayLabel}: {m.pct}%</span>
                </div>
                <div style={{ height: "4px", borderRadius: "2px", background: TOKENS.colors.border }}>
                  <div style={{ height: "4px", borderRadius: "2px", background: fill, width: `${Math.min(m.pct, 100)}%`, transition: "width 0.4s ease" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 3.4 YOUR PRIORITIES ── */}
      <div className="a-rise" style={{ marginBottom: "20px" }}>
        <div style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", color: TOKENS.colors.textFaint, letterSpacing: "0.5px", marginBottom: "10px" }}>
          Your Priorities
        </div>

        {hasReport || hasMedicines ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {/* Marker priority (e.g. Iron) */}
            {hasReport && flaggedMarkers[0] && (
              <PriorityCard
                label={flaggedMarkers[0].marker_id.replace("_", " ").replace(/^\w/, c => c.toUpperCase())}
                value={`${Math.round((flaggedMarkers[0].value / flaggedMarkers[0].range_low) * 100)}%`}
                bar={{ pct: Math.round((flaggedMarkers[0].value / flaggedMarkers[0].range_low) * 100), color: TOKENS.colors.green }}
                caption={t("home.fromReport")}
              />
            )}

            {/* Behavioral priority: worst macro */}
            {(() => {
              const worst = macros.reduce((a, b) => a.pct < b.pct ? a : b);
              return (
                <PriorityCard
                  label={worst.label}
                  value={`${worst.current}/${worst.target}g`}
                  valueColor={TOKENS.colors.amber}
                  bar={{ pct: worst.pct, color: TOKENS.colors.amber }}
                  caption={t("home.behindForDay")}
                />
              );
            })()}

            {/* Medicine priority — materialized only */}
            {hasMedicines && (
              <PriorityCard
                label="Medicine"
                value={`${medicineTakenCount} of ${medicineTotalCount} taken today`}
                valueSmall
                caption={t("home.fromPrescription")}
                action={
                  <button
                    onClick={() => {
                      const next = medicines.find(m => !m.taken_today[0]);
                      if (next) { toggleMedicineTaken(next.id); toast(t("toast.noted"), { tone: "success" }); }
                    }}
                    style={{
                      width: "24px", height: "24px", borderRadius: "6px",
                      background: TOKENS.colors.greenSoft, border: "none",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", flexShrink: 0
                    }}
                  >
                    <Check size={14} style={{ color: TOKENS.colors.green }} />
                  </button>
                }
              />
            )}
          </div>
        ) : (
          /* Invitation card when no report & no medicines */
          <div style={{
            background: TOKENS.colors.greenSoft,
            borderRadius: TOKENS.borderRadius.card,
            padding: "20px",
            textAlign: "center"
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
              onClick={() => onNavigateToHealth && onNavigateToHealth()}
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
      </div>

      {/* ── 3.5 TRACKER TILES ── */}
      <div className="a-rise" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "20px" }}>
        {/* Water */}
        <TrackerTile
          icon={<Droplet size={16} style={{ color: TOKENS.colors.green }} />}
          value={`${waterGlasses}/9 glasses`}
          onAdd={() => { addWaterGlass(); toast(t("toast.oneGlass"), { tone: "success" }); }}
        />
        {/* Activity */}
        <TrackerTile
          icon={<Footprints size={16} style={{ color: TOKENS.colors.green }} />}
          value={latestActivity ? latestActivity.label : "No activity"}
          onAdd={() => onOpenAssistant("text", "e.g. 20 min walk")}
        />
        {/* Weight */}
        <TrackerTile
          icon={<Scale size={16} style={{ color: TOKENS.colors.green }} />}
          value={weightKg ? `${weightKg} kg` : "— kg"}
          onAdd={() => onOpenAssistant("text")}
        />
      </div>

      {/* ── 3.6 LOGGED TODAY ── */}
      <div className="a-rise">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", color: TOKENS.colors.textFaint, letterSpacing: "0.5px" }}>
            Logged Today
          </span>
          <button
            onClick={() => onOpenAssistant("text")}
            style={{ background: "none", border: "none", fontSize: "12px", fontWeight: 500, color: TOKENS.colors.green, cursor: "pointer" }}
          >
            + add
          </button>
        </div>

        {logsToday && logsToday.length > 0 ? (
          <div>
            {logsToday.map((log, idx) => (
              <div
                key={log.id || idx}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 0",
                  borderTop: idx === 0 ? "none" : `1px solid ${TOKENS.colors.border}`,
                  fontSize: "13px", color: TOKENS.colors.ink
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <LogTypeIcon type={log.type} />
                  <span>{getLogLabel(log)}</span>
                </div>
                <span style={{ fontSize: "12px", color: TOKENS.colors.textFaint, flexShrink: 0, marginLeft: "8px" }}>
                  {formatTime(log.ts)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: "center",
            padding: "24px 16px",
            color: TOKENS.colors.textMuted,
            fontSize: "13px",
            background: TOKENS.colors.greenSoft,
            borderRadius: TOKENS.borderRadius.cardCompact,
            lineHeight: 1.6
          }}>
            <div style={{ marginBottom: "8px", display: "flex", justifyContent: "center" }}>
              <UtensilsCrossed size={28} style={{ color: TOKENS.colors.green, opacity: 0.7 }} />
            </div>
            <div style={{ fontFamily: TOKENS.fonts.assistant, fontWeight: 500, color: TOKENS.colors.ink, marginBottom: "4px" }}>
              Nothing logged yet
            </div>
            <div>Tap the <strong style={{ color: TOKENS.colors.green }}>mic button</strong> below or type to log your first meal.</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────

const quickActionBtnStyle = {
  width: "32px", height: "32px", borderRadius: "10px",
  background: "#FFFFFF",
  border: `1px solid ${TOKENS.colors.border}`,
  display: "flex", alignItems: "center", justifyContent: "center",
  cursor: "pointer", padding: 0
};

function PriorityCard({ label, value, valueColor, valueSmall, bar, caption, action }) {
  return (
    <div style={{
      background: TOKENS.colors.surface,
      border: `1px solid ${TOKENS.cardBorder}`,
      borderRadius: TOKENS.borderRadius.card,
      padding: "14px 14px 12px",
      boxShadow: TOKENS.shadows.card,
      display: "flex", flexDirection: "column", justifyContent: "space-between",
      minHeight: "90px"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: "13px", fontWeight: 500, color: TOKENS.colors.ink, marginBottom: "4px" }}>{label}</div>
          <div style={{
            fontFamily: valueSmall ? TOKENS.fonts.data : TOKENS.fonts.assistant,
            fontSize: valueSmall ? "13px" : "18px",
            fontWeight: 500,
            color: valueColor || TOKENS.colors.ink
          }}>
            {value}
          </div>
        </div>
        {action && action}
      </div>
      {bar && (
        <div style={{ height: "5px", borderRadius: "3px", background: TOKENS.colors.border, marginTop: "8px" }}>
          <div style={{ height: "5px", borderRadius: "3px", background: bar.color, width: `${Math.min(bar.pct, 100)}%`, transition: "width 0.4s ease" }} />
        </div>
      )}
      {caption && (
        <div style={{ fontSize: "11px", color: TOKENS.colors.textFaint, marginTop: "6px" }}>{caption}</div>
      )}
    </div>
  );
}

function TrackerTile({ icon, value, onAdd }) {
  return (
    <div style={{
      background: TOKENS.colors.surface,
      border: `1px solid ${TOKENS.cardBorder}`,
      borderRadius: TOKENS.borderRadius.cardCompact,
      padding: "12px",
      boxShadow: TOKENS.shadows.card,
      display: "flex", flexDirection: "column", gap: "8px"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {icon}
        <button
          onClick={onAdd}
          style={{
            width: "22px", height: "22px", borderRadius: "6px",
            background: TOKENS.colors.greenSoft, border: "none",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", padding: 0
          }}
        >
          <Plus size={12} style={{ color: TOKENS.colors.green }} />
        </button>
      </div>
      <span style={{ fontSize: "12px", color: TOKENS.colors.ink, fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function LogTypeIcon({ type }) {
  const s = { color: TOKENS.colors.textFaint, flexShrink: 0 };
  if (type === "food") return <UtensilsCrossed size={14} style={s} />;
  if (type === "activity") return <Footprints size={14} style={s} />;
  if (type === "prescription_snap" || type === "camera") return <Camera size={14} style={s} />;
  if (type === "water") return <Droplet size={14} style={s} />;
  return <UtensilsCrossed size={14} style={s} />;
}

function getLogLabel(log) {
  if (log.type === "food" && log.parse?.food) {
    return log.parse.food.map((f) => f.dish || `${f.size} ${f.dish}`).join(", ");
  }
  if (log.type === "activity") return log.label || "Activity";
  if (log.type === "water") return `${log.parse?.water_glasses || 1} Glass of Water`;
  if (log.type === "weight") return `Logged weight: ${log.parse?.weight_kg} kg`;
  if (log.type === "prescription_snap") return log.label || "Prescription snapped";
  return log.label || "Log entry";
}

export default Home;
