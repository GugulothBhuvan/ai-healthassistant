// Trends screen — v3 (§4): replaces Week tab
// Delta strip · Marker trend hero · Energy card · Noticed this week · Bento (dots + kitchen)

import React, { useState } from "react";
import { TOKENS } from "../tokens.js";
import { t } from "../lib/copy.js";
import { useAppState } from "../lib/useAppState.jsx";
import { Skeleton } from "../ui/primitives.jsx";

// ── Helpers ──────────────────────────────────────────────────
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Demo energy data (7 days)
const DEMO_ENERGY = [
  { day: "Mon", inKcal: 1650, burned: 180 },
  { day: "Tue", inKcal: 1420, burned: 90 },
  { day: "Wed", inKcal: 1780, burned: 200 },
  { day: "Thu", inKcal: 1510, burned: 80 },
  { day: "Fri", inKcal: 1690, burned: 170 },
  { day: "Sat", inKcal: 1820, burned: 250 },
  { day: "Sun", inKcal: 986, burned: 210 },
];

// Demo log dot grid (June — 30 days)
function buildDotGrid() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // current month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayDate = today.getDate();

  const dots = [];
  for (let d = 1; d <= daysInMonth; d++) {
    let status = "future";
    if (d < todayDate) {
      // Demo: most days logged, a few missed
      status = [3, 8, 15, 22].includes(d) ? "missed" : "logged";
    } else if (d === todayDate) {
      status = "logged";
    }
    dots.push({ day: d, status });
  }
  return dots;
}

// ── Main ─────────────────────────────────────────────────────
export function Trends() {
  const state = useAppState();
  const [period, setPeriod] = useState("week"); // week | month
  const dots = buildDotGrid();

  if (state.loading) {
    return (
      <div style={{ fontFamily: TOKENS.fonts.data, paddingBottom: "88px" }}>
        <Skeleton height={40} style={{ borderRadius: "8px", marginBottom: "16px" }} />
        <Skeleton height={80} style={{ borderRadius: TOKENS.borderRadius.card, marginBottom: "16px" }} />
        <Skeleton height={200} style={{ borderRadius: TOKENS.borderRadius.card, marginBottom: "16px" }} />
        <Skeleton height={160} style={{ borderRadius: TOKENS.borderRadius.card }} />
      </div>
    );
  }

  const { kitchen } = state;

  return (
    <div style={{ fontFamily: TOKENS.fonts.data, color: TOKENS.colors.ink, paddingBottom: "88px" }}>
      <style>{`
        @keyframes aRise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .a-rise { animation: aRise 0.5s cubic-bezier(0.16,1,0.3,1) both; }
      `}</style>

      {/* ── Header ── */}
      <div className="a-rise" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
        <h1 style={{ fontFamily: TOKENS.fonts.assistant, fontSize: "22px", fontWeight: 500, margin: 0, color: TOKENS.colors.ink }}>
          Trends
        </h1>
        {/* Segmented pill */}
        <div style={{
          display: "flex", borderRadius: "20px", overflow: "hidden",
          border: `1px solid ${TOKENS.colors.border}`, background: TOKENS.colors.surface
        }}>
          {["week", "month"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: "5px 14px", fontSize: "12px", fontWeight: 500, border: "none", cursor: "pointer",
                background: period === p ? TOKENS.colors.ink : "transparent",
                color: period === p ? "#FFFFFF" : TOKENS.colors.textMuted,
                fontFamily: TOKENS.fonts.data,
                transition: "all 0.2s ease"
              }}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <p style={{ fontFamily: TOKENS.fonts.assistant, fontSize: "12.5px", color: TOKENS.colors.textMuted, margin: "0 0 20px" }}>
        {t("trends.subtitle")}
      </p>

      {/* ── 4.1 Delta strip ── */}
      <div className="a-rise" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "20px" }}>
        <DeltaCard label="Protein/day" value="41" unit="g" delta="▲ 14% vs last wk" deltaColor={TOKENS.colors.green} />
        <DeltaCard label="Activity" value="142" unit="min" delta="▲ 20 min" deltaColor={TOKENS.colors.green} />
        <DeltaCard label="Log days" value="6/7" unit="" delta="same as last" deltaColor={TOKENS.colors.textMuted} />
      </div>

      {/* ── 4.2 Marker trend hero card ── */}
      <div className="a-rise" style={{
        background: TOKENS.gradients.heroCard,
        border: `1px solid ${TOKENS.heroCardBorder}`,
        borderRadius: TOKENS.borderRadius.card,
        padding: "18px 20px 16px",
        boxShadow: TOKENS.shadows.card,
        marginBottom: "16px"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "14px" }}>
          <span style={{ fontSize: "14px", fontWeight: 600, color: TOKENS.colors.ink }}>Iron intake · 5 weeks</span>
          <span style={{ fontSize: "11px", color: TOKENS.colors.textFaint }}>{t("home.fromReport")}</span>
        </div>

        {/* Weekly bars */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "80px", marginBottom: "12px" }}>
          {["#CFE0D8", "#CFE0D8", "#9CC0B1", "#5E9481", "#17594A"].map((color, i) => {
            const heights = [25, 30, 50, 70, 95]; // percent
            return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                <div style={{
                  width: "100%", maxWidth: "32px",
                  height: `${heights[i]}%`,
                  borderRadius: "4px 4px 2px 2px",
                  background: color,
                  transition: "height 0.5s ease"
                }} />
                <span style={{ fontSize: "11px", color: TOKENS.colors.textMuted }}>
                  {i < 4 ? `W${i + 1}` : "now"}
                </span>
              </div>
            );
          })}
        </div>

        <p style={{ fontFamily: TOKENS.fonts.assistant, fontSize: "12px", color: TOKENS.colors.ink, margin: "0 0 2px", lineHeight: 1.5 }}>
          {t("trends.markerInsight")}
        </p>
        <p style={{ fontFamily: TOKENS.fonts.assistant, fontSize: "11px", color: TOKENS.colors.textFaint, margin: 0 }}>
          {t("trends.honestyCap")}
        </p>
      </div>

      {/* ── 4.3 Energy card ── */}
      <div className="a-rise" style={{
        background: TOKENS.colors.surface,
        border: `1px solid ${TOKENS.cardBorder}`,
        borderRadius: TOKENS.borderRadius.card,
        padding: "18px 20px 16px",
        boxShadow: TOKENS.shadows.card,
        marginBottom: "16px"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <span style={{ fontSize: "14px", fontWeight: 600, color: TOKENS.colors.ink }}>Energy · in vs burned</span>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <LegendDot color={TOKENS.colors.green} label="in" />
            <LegendDot color={TOKENS.colors.amber} label="burned" />
          </div>
        </div>

        {/* 7-day paired bars */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "90px" }}>
          {DEMO_ENERGY.map((d, i) => {
            const maxKcal = 2000;
            const inH = Math.round((d.inKcal / maxKcal) * 100);
            const burnH = Math.round((d.burned / maxKcal) * 100);
            const burnColor = d.burned < 120 ? "#E8D5AF" : TOKENS.colors.amber;
            return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}>
                <div style={{ display: "flex", gap: "2px", alignItems: "flex-end", height: "72px" }}>
                  <div style={{ width: "8px", height: `${inH}%`, borderRadius: "3px 3px 1px 1px", background: TOKENS.colors.green, transition: "height 0.4s ease" }} />
                  <div style={{ width: "8px", height: `${burnH}%`, borderRadius: "3px 3px 1px 1px", background: burnColor, transition: "height 0.4s ease" }} />
                </div>
                <span style={{ fontSize: "11px", color: TOKENS.colors.textMuted }}>{d.day}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 4.4 "Noticed this week" ── */}
      <div className="a-rise" style={{
        background: TOKENS.colors.surface,
        border: `1px solid ${TOKENS.cardBorder}`,
        borderRadius: TOKENS.borderRadius.card,
        padding: "14px 16px",
        boxShadow: TOKENS.shadows.card,
        marginBottom: "20px"
      }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "stretch" }}>
          <div style={{
            width: "3px", flexShrink: 0, borderRadius: "2px",
            background: `linear-gradient(180deg, ${TOKENS.colors.green}, ${TOKENS.colors.amber})`
          }} />
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", color: TOKENS.colors.textFaint, letterSpacing: "0.5px", marginBottom: "6px" }}>
              Noticed this week
            </div>
            <p style={{
              fontFamily: TOKENS.fonts.assistant,
              fontSize: "12.5px",
              color: TOKENS.colors.ink,
              margin: 0,
              lineHeight: 1.5
            }}>
              {t("trends.noticedWeek")}
            </p>
          </div>
        </div>
      </div>

      {/* ── 4.5 Bottom bento ── */}
      <div className="a-rise" style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr", gap: "12px" }}>
        {/* Days with logs — dot grid */}
        <div style={{
          background: TOKENS.colors.surface,
          border: `1px solid ${TOKENS.cardBorder}`,
          borderRadius: TOKENS.borderRadius.card,
          padding: "14px 16px",
          boxShadow: TOKENS.shadows.card
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "10px" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: TOKENS.colors.ink }}>Days with logs</span>
            <span style={{ fontSize: "11px", color: TOKENS.colors.textFaint }}>
              {new Date().toLocaleDateString("en-IN", { month: "long" })}
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "5px", marginBottom: "8px" }}>
            {dots.map((dot) => (
              <div
                key={dot.day}
                style={{
                  width: "12px", height: "12px", borderRadius: "50%",
                  background: dot.status === "logged"
                    ? `rgba(23,89,74,0.85)`     // green @85%
                    : dot.status === "missed"
                    ? TOKENS.colors.border       // line color (equal weight)
                    : "#F3F1EC",                 // future
                  border: dot.status === "future" ? `1px solid ${TOKENS.colors.border}` : "none",
                  margin: "0 auto"
                }}
              />
            ))}
          </div>
          <p style={{ fontFamily: TOKENS.fonts.assistant, fontSize: "11px", color: TOKENS.colors.textFaint, margin: 0 }}>
            {t("trends.logCaption")}
          </p>
        </div>

        {/* Your kitchen */}
        <div style={{
          background: TOKENS.colors.surface,
          border: `1px solid ${TOKENS.cardBorder}`,
          borderRadius: TOKENS.borderRadius.card,
          padding: "14px 16px",
          boxShadow: TOKENS.shadows.card
        }}>
          <span style={{ fontSize: "13px", fontWeight: 600, color: TOKENS.colors.ink, display: "block", marginBottom: "10px" }}>
            Your kitchen
          </span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {(kitchen || []).map((item) => (
              <span
                key={item.name}
                style={{
                  background: TOKENS.colors.greenSoft,
                  color: TOKENS.colors.green,
                  fontSize: "11px",
                  fontWeight: 500,
                  padding: "4px 10px",
                  borderRadius: "20px"
                }}
              >
                {item.name} ×{item.count}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────

function DeltaCard({ label, value, unit, delta, deltaColor }) {
  return (
    <div style={{
      background: TOKENS.colors.surface,
      border: `1px solid ${TOKENS.cardBorder}`,
      borderRadius: TOKENS.borderRadius.card,
      padding: "14px 12px",
      boxShadow: TOKENS.shadows.card
    }}>
      <div style={{ fontSize: "11px", color: TOKENS.colors.textMuted, marginBottom: "6px" }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: "3px" }}>
        <span style={{ fontFamily: TOKENS.fonts.assistant, fontSize: "18px", fontWeight: 500, color: TOKENS.colors.ink }}>{value}</span>
        {unit && <span style={{ fontSize: "12px", color: TOKENS.colors.textMuted }}>{unit}</span>}
      </div>
      <div style={{ fontSize: "11px", color: deltaColor, marginTop: "4px" }}>{delta}</div>
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: color }} />
      <span style={{ fontSize: "11px", color: TOKENS.colors.textMuted }}>{label}</span>
    </div>
  );
}

export default Trends;
