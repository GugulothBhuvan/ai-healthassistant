// Trends screen — Weekly progress charts & Monthly interactive log calendar
// Handles mobile, tablet, and desktop viewports with Lucide icons (no raw emojis).

import React, { useState, useEffect } from "react";
import { TOKENS } from "../tokens.js";
import { t } from "../lib/copy.js";
import { useAppState } from "../lib/useAppState.jsx";
import { apiFetch } from "../lib/api.js";
import { Skeleton } from "../ui/primitives.jsx";
import {
  TrendingUp, Activity, BarChart2, ShieldAlert, Heart, Calendar,
  ChevronLeft, ChevronRight, X, UtensilsCrossed, Droplet, Scale, Footprints
} from "lucide-react";

// ── Helpers ──────────────────────────────────────────────────
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function Trends() {
  const state = useAppState();
  const [period, setPeriod] = useState("week"); // week | month
  
  // Month View State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthLogs, setMonthLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [selectedDateLogs, setSelectedDateLogs] = useState(null); // { dateStr, dateObj, logs }

  const { weekData, logsToday, kitchen, activityLogs, targets, flaggedMarkers } = state;

  // ── Fetch Month Logs ─────────────────────────────────────────
  const fetchMonthLogs = async () => {
    try {
      setLogsLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1).toISOString().split("T")[0];
      const lastDay = new Date(year, month + 1, 0).toISOString().split("T")[0];
      
      const res = await apiFetch(`/logs?start=${firstDay}&end=${lastDay}`);
      setMonthLogs(res.logs || []);
    } catch (err) {
      console.error("Failed to fetch month logs:", err);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    if (period === "month") {
      fetchMonthLogs();
    }
  }, [currentDate, period]);

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

  const formatDayName = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { weekday: "short" });
  };

  // ── Weekly Calculations ──────────────────────────────────────
  const loggedDays = (weekData && weekData.days) ? weekData.days.filter(d => d.calories > 0 || d.water_glasses > 0 || d.burned > 0) : [];
  const avgProtein = loggedDays.length > 0
    ? Math.round(loggedDays.reduce((sum, d) => sum + (d.protein_g || 0), 0) / loggedDays.length)
    : 0;

  const totalActivityMin = (activityLogs || []).reduce((sum, a) => sum + (a.minutes || 0), 0);
  const logDaysCount = loggedDays.length;

  const energyData = (weekData && weekData.days) ? weekData.days.map(d => ({
    day: formatDayName(d.date),
    inKcal: d.calories || 0,
    burned: d.burned || 0
  })) : DAYS.map(d => ({ day: d, inKcal: 0, burned: 0 }));

  // ── Month Calendar Calculations ──────────────────────────────
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  // Calculate day index for start of month (Monday-based grid)
  let firstDayIndex = new Date(year, month, 1).getDay(); // Sun=0, Mon=1, etc.
  firstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // Mon=0, Tue=1 ... Sun=6

  const calendarCells = [];
  // Padding cells for previous month
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push({ type: "empty" });
  }
  // Days of current month
  for (let d = 1; d <= daysInMonth; d++) {
    // Generate date string in local timezone format
    const localDate = new Date(year, month, d);
    const offset = localDate.getTimezoneOffset();
    const correctedDate = new Date(localDate.getTime() - (offset * 60 * 1000));
    const dateStr = correctedDate.toISOString().split("T")[0];

    const dayLogs = monthLogs.filter(log => log.ts.split("T")[0] === dateStr);
    calendarCells.push({
      type: "day",
      dayNum: d,
      dateStr,
      dateObj: localDate,
      logs: dayLogs
    });
  }

  // 30-day dot grid for bento (remains active in weekly view)
  const dots = [];
  const todayDate = new Date().getDate();
  const loggedDateStrings = new Set(
    (weekData && weekData.days)
      ? weekData.days.filter(day => day.calories > 0 || day.water_glasses > 0 || day.burned > 0).map(day => day.date)
      : []
  );

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month, d);
    const offset = dateObj.getTimezoneOffset();
    const localDateObj = new Date(dateObj.getTime() - (offset * 60 * 1000));
    const dateStr = localDateObj.toISOString().split("T")[0];

    let status = "future";
    if (d < todayDate) {
      status = loggedDateStrings.has(dateStr) ? "logged" : "missed";
    } else if (d === todayDate) {
      status = logsToday && logsToday.length > 0 ? "logged" : "missed";
    }
    dots.push({ day: d, status });
  }

  const hasReport = flaggedMarkers && flaggedMarkers.length > 0;
  const firstFlag = hasReport ? flaggedMarkers[0] : null;

  // Month navigation helpers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  return (
    <div style={{ fontFamily: TOKENS.fonts.data, color: TOKENS.colors.ink, paddingBottom: "88px" }}>
      <style>{`
        @keyframes aRise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .a-rise { animation: aRise 0.5s cubic-bezier(0.16,1,0.3,1) both; }
      `}</style>

      {/* ── Header Row ── */}
      <div className="a-rise" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
        <h1 style={{ fontFamily: TOKENS.fonts.assistant, fontSize: "22px", fontWeight: 500, margin: 0, color: TOKENS.colors.ink }}>
          Trends
        </h1>
        {/* Segmented control: Week | Month */}
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

      {/* ── PERIOD 1: WEEKLY VIEW ── */}
      {period === "week" && (
        <div className="a-rise" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Delta strip */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
            <DeltaCard label="Protein/day" value={`${avgProtein}`} unit="g" delta={`target ${targets?.protein_g || 52}g`} />
            <DeltaCard label="Activity" value={`${totalActivityMin}`} unit="min" delta="total this week" />
            <DeltaCard label="Log days" value={`${logDaysCount}/7`} unit="" delta="days logged" />
          </div>

          {/* Marker Trend Card */}
          <div style={{
            background: TOKENS.gradients.heroCard,
            border: `1px solid ${TOKENS.heroCardBorder}`,
            borderRadius: TOKENS.borderRadius.card,
            padding: "18px 20px 16px",
            boxShadow: TOKENS.shadows.card
          }}>
            {hasReport && firstFlag ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "14px" }}>
                  <span style={{ fontSize: "14px", fontWeight: 600, color: TOKENS.colors.ink }}>{firstFlag.marker_id.toUpperCase()} support · weekly</span>
                  <span style={{ fontSize: "11px", color: TOKENS.colors.textFaint }}>{t("home.fromReport")}</span>
                </div>

                <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "80px", marginBottom: "12px" }}>
                  {loggedDays.map((d, i) => {
                    const val = firstFlag.marker_id === "iron" ? d.protein_g : d.fibre_g;
                    const targetVal = firstFlag.marker_id === "iron" ? (targets?.protein_g || 52) : (targets?.fibre_g || 30);
                    const h = targetVal > 0 ? Math.min(100, Math.round((val / targetVal) * 100)) : 0;
                    const color = h >= 60 ? TOKENS.colors.green : TOKENS.colors.amber;
                    return (
                      <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                        <div style={{
                          width: "100%", maxWidth: "32px",
                          height: `${Math.max(10, h)}%`,
                          borderRadius: "4px 4px 2px 2px",
                          background: color,
                          transition: "height 0.5s ease"
                        }} />
                        <span style={{ fontSize: "11px", color: TOKENS.colors.textMuted }}>
                          {formatDayName(d.date)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <p style={{ fontFamily: TOKENS.fonts.assistant, fontSize: "12px", color: TOKENS.colors.ink, margin: "0 0 2px", lineHeight: 1.5 }}>
                  Supporting {firstFlag.marker_id.replace("_", " ")} gaps with targeted nutrient intake.
                </p>
              </>
            ) : (
              <div style={{ padding: "12px 0", textAlign: "center" }}>
                <ShieldAlert size={28} style={{ color: TOKENS.colors.textMuted, opacity: 0.7, marginBottom: "8px" }} />
                <div style={{ fontSize: "13.5px", fontWeight: 600, color: TOKENS.colors.ink, marginBottom: "4px" }}>
                  No blood marker trend linked
                </div>
                <div style={{ fontSize: "12px", color: TOKENS.colors.textMuted }}>
                  Marker support trends require a blood report. Go to the Health tab to upload.
                </div>
              </div>
            )}
            <p style={{ fontFamily: TOKENS.fonts.assistant, fontSize: "11px", color: TOKENS.colors.textFaint, margin: "6px 0 0" }}>
              {t("trends.honestyCap")}
            </p>
          </div>

          {/* Energy card */}
          <div style={{
            background: TOKENS.colors.surface,
            border: `1px solid ${TOKENS.cardBorder}`,
            borderRadius: TOKENS.borderRadius.card,
            padding: "18px 20px 16px",
            boxShadow: TOKENS.shadows.card
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <span style={{ fontSize: "14px", fontWeight: 600, color: TOKENS.colors.ink }}>Energy · in vs burned</span>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <LegendDot color={TOKENS.colors.green} label="in" />
                <LegendDot color={TOKENS.colors.amber} label="burned" />
              </div>
            </div>

            {/* paired bars */}
            <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "90px" }}>
              {energyData.map((d, i) => {
                const maxKcal = Math.max(2000, ...energyData.map(day => Math.max(day.inKcal, day.burned)));
                const inH = maxKcal > 0 ? Math.round((d.inKcal / maxKcal) * 100) : 0;
                const burnH = maxKcal > 0 ? Math.round((d.burned / maxKcal) * 100) : 0;
                
                // Represent zero height with tiny 3px placeholder so chart structure is clear
                const showInH = d.inKcal > 0 ? inH : 4;
                const showBurnH = d.burned > 0 ? burnH : 4;
                const inColor = d.inKcal > 0 ? TOKENS.colors.green : TOKENS.colors.border;
                const burnColor = d.burned > 0 ? TOKENS.colors.amber : TOKENS.colors.border;

                return (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}>
                    <div style={{ display: "flex", gap: "2px", alignItems: "flex-end", height: "72px" }}>
                      <div style={{ width: "8px", height: `${showInH}%`, borderRadius: "3px 3px 1px 1px", background: inColor, transition: "height 0.4s ease" }} />
                      <div style={{ width: "8px", height: `${showBurnH}%`, borderRadius: "3px 3px 1px 1px", background: burnColor, transition: "height 0.4s ease" }} />
                    </div>
                    <span style={{ fontSize: "11px", color: TOKENS.colors.textMuted }}>{d.day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Noticed this week */}
          <div style={{
            background: TOKENS.colors.surface,
            border: `1px solid ${TOKENS.cardBorder}`,
            borderRadius: TOKENS.borderRadius.card,
            padding: "14px 16px",
            boxShadow: TOKENS.shadows.card
          }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "stretch" }}>
              <div style={{
                width: "3px", flexShrink: 0, borderRadius: "2px",
                background: `linear-gradient(180deg, ${TOKENS.colors.green}, ${TOKENS.colors.amber})`
              }} />
              <div>
                <div style={{ fontSize: "11.5px", fontWeight: 600, textTransform: "uppercase", color: TOKENS.colors.textFaint, letterSpacing: "0.5px", marginBottom: "6px" }}>
                  Noticed this week
                </div>
                <p style={{
                  fontFamily: TOKENS.fonts.assistant,
                  fontSize: "12.5px",
                  color: TOKENS.colors.ink,
                  margin: 0,
                  lineHeight: 1.5
                }}>
                  {loggedDays.length > 2 
                    ? t("trends.noticedWeek")
                    : "Log meals and activities to see weekly pattern insights."
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Bento */}
          <div style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr", gap: "12px" }}>
            {/* Days with logs */}
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
                  {currentDate.toLocaleDateString("en-IN", { month: "short" })}
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "5px", marginBottom: "8px" }}>
                {dots.map((dot) => (
                  <div
                    key={dot.day}
                    style={{
                      width: "12px", height: "12px", borderRadius: "50%",
                      background: dot.status === "logged"
                        ? `rgba(23,89,74,0.85)`
                        : dot.status === "missed"
                        ? TOKENS.colors.border
                        : "#F3F1EC",
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
              {kitchen && kitchen.length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {kitchen.map((item) => (
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
              ) : (
                <div style={{ fontSize: "11px", color: TOKENS.colors.textFaint }}>
                  No food logged this week.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── PERIOD 2: MONTHLY INTERACTIVE CALENDAR VIEW ── */}
      {period === "month" && (
        <div className="a-rise" style={{
          background: TOKENS.colors.surface,
          border: `1px solid ${TOKENS.cardBorder}`,
          borderRadius: TOKENS.borderRadius.card,
          padding: "18px 16px 20px",
          boxShadow: TOKENS.shadows.card
        }}>
          {/* Calendar Header with navigation */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
            <button
              onClick={handlePrevMonth}
              style={{
                background: "none", border: "none", cursor: "pointer",
                padding: "8px", color: TOKENS.colors.green, display: "flex", alignItems: "center"
              }}
            >
              <ChevronLeft size={20} />
            </button>
            <div style={{
              fontFamily: TOKENS.fonts.assistant, fontSize: "17px", fontWeight: 600,
              color: TOKENS.colors.ink, textTransform: "capitalize"
            }}>
              {currentDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
            </div>
            <button
              onClick={handleNextMonth}
              style={{
                background: "none", border: "none", cursor: "pointer",
                padding: "8px", color: TOKENS.colors.green, display: "flex", alignItems: "center"
              }}
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Weekday headers */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(7, 1fr)",
            textAlign: "center", marginBottom: "10px", borderBottom: `1px solid ${TOKENS.colors.border}`,
            paddingBottom: "8px"
          }}>
            {DAYS.map(day => (
              <span key={day} style={{ fontSize: "11.5px", fontWeight: 600, color: TOKENS.colors.textMuted }}>
                {day}
              </span>
            ))}
          </div>

          {/* Date Grid */}
          {logsLoading ? (
            <div style={{ padding: "40px 0", textAlign: "center", color: TOKENS.colors.textMuted }}>
              Loading logs...
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px 4px" }}>
              {calendarCells.map((cell, idx) => {
                if (cell.type === "empty") {
                  return <div key={`empty-${idx}`} />;
                }

                const isToday = cell.dateStr === new Date().toISOString().split("T")[0];
                const hasLogs = cell.logs && cell.logs.length > 0;

                return (
                  <div
                    key={cell.dateStr}
                    onClick={() => setSelectedDateLogs({ dateStr: cell.dateStr, dateObj: cell.dateObj, logs: cell.logs })}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      height: "44px", borderRadius: "10px", cursor: "pointer",
                      border: isToday ? `1px solid ${TOKENS.colors.green}` : "none",
                      background: isToday ? TOKENS.colors.greenSoft : "transparent",
                      transition: "background 0.2s"
                    }}
                    className="cal-day-cell"
                  >
                    <span style={{
                      fontSize: "13.5px", fontWeight: isToday ? 600 : 500,
                      color: isToday ? TOKENS.colors.green : TOKENS.colors.ink
                    }}>
                      {cell.dayNum}
                    </span>
                    
                    {/* Log status indicator dot */}
                    <div style={{
                      width: "5px", height: "5px", borderRadius: "50%",
                      background: hasLogs ? TOKENS.colors.green : "transparent",
                      marginTop: "3px"
                    }} />
                  </div>
                );
              })}
            </div>
          )}

          <p style={{
            fontSize: "11px", color: TOKENS.colors.textFaint, textAlign: "center",
            marginTop: "16px", marginBottom: 0, fontFamily: TOKENS.fonts.assistant
          }}>
            Click any day to view or record entries. Green dots denote days with recorded logs.
          </p>
        </div>
      )}

      {/* ── POP-UP MODAL SCREEN FOR DAY LOGS ── */}
      {selectedDateLogs && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 20000,
          background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center",
          padding: "16px", animation: "tourOverlayIn 0.2s ease"
        }}>
          {/* Click blocker background */}
          <div style={{ position: "absolute", inset: 0 }} onClick={() => setSelectedDateLogs(null)} />
          
          {/* Modal content card */}
          <div style={{
            position: "relative", width: "100%", maxWidth: "400px",
            background: TOKENS.colors.surface, borderRadius: TOKENS.borderRadius.card,
            boxShadow: "0 10px 40px rgba(0,0,0,0.25)", overflow: "hidden",
            padding: "20px", display: "flex", flexDirection: "column", gap: "16px",
            animation: "tourFadeIn 0.25s ease both"
          }}>
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h3 style={{
                  fontFamily: TOKENS.fonts.assistant, fontSize: "18px", fontWeight: 600,
                  margin: 0, color: TOKENS.colors.ink
                }}>
                  {selectedDateLogs.dateObj.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
                </h3>
                <span style={{ fontSize: "11px", color: TOKENS.colors.textFaint }}>
                  Daily Activity Log
                </span>
              </div>
              <button
                onClick={() => setSelectedDateLogs(null)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  padding: "4px", color: TOKENS.colors.textMuted, display: "flex", alignItems: "center"
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable logs list */}
            <div style={{
              maxHeight: "300px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px",
              paddingRight: "4px"
            }}>
              {selectedDateLogs.logs && selectedDateLogs.logs.length > 0 ? (
                selectedDateLogs.logs.map((log, idx) => (
                  <div
                    key={log.id || idx}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: "10px",
                      padding: "10px 12px", background: TOKENS.colors.bg,
                      borderRadius: "10px", border: `1px solid ${TOKENS.colors.border}`
                    }}
                  >
                    <div style={{
                      marginTop: "2px", width: "24px", height: "24px", borderRadius: "6px",
                      background: TOKENS.colors.greenSoft, display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0
                    }}>
                      <ModalLogIcon type={log.type} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "12px", color: TOKENS.colors.textFaint, display: "flex", justifyContent: "space-between" }}>
                        <span style={{ textTransform: "capitalize", fontWeight: 600 }}>{log.type}</span>
                        <span>{new Date(log.ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <p style={{ fontSize: "13px", color: TOKENS.colors.ink, margin: "4px 0 0", lineHeight: 1.45 }}>
                        {getLogLabel(log)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{
                  padding: "32px 16px", textAlign: "center", color: TOKENS.colors.textMuted,
                  background: TOKENS.colors.bg, borderRadius: "10px", border: `1px dashed ${TOKENS.colors.border}`
                }}>
                  <Calendar size={28} style={{ color: TOKENS.colors.textMuted, opacity: 0.5, marginBottom: "8px" }} />
                  <div style={{ fontSize: "13.5px", fontWeight: 600, color: TOKENS.colors.ink, marginBottom: "2px" }}>
                    No logs recorded
                  </div>
                  <div style={{ fontSize: "11px", color: TOKENS.colors.textFaint }}>
                    Nothing was logged on this date.
                  </div>
                </div>
              )}
            </div>

            {/* Modal actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "4px" }}>
              <button
                onClick={() => setSelectedDateLogs(null)}
                style={{
                  padding: "8px 16px", background: TOKENS.colors.green, color: "#FFFFFF",
                  border: "none", borderRadius: TOKENS.borderRadius.pill, fontSize: "12.5px",
                  fontWeight: 600, cursor: "pointer", fontFamily: TOKENS.fonts.data
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────

function DeltaCard({ label, value, unit, delta }) {
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
      <div style={{ fontSize: "11px", color: TOKENS.colors.textFaint, marginTop: "4px" }}>{delta}</div>
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

function ModalLogIcon({ type }) {
  const s = { color: TOKENS.colors.green };
  if (type === "food") return <UtensilsCrossed size={12} style={s} />;
  if (type === "activity") return <Footprints size={12} style={s} />;
  if (type === "water") return <Droplet size={12} style={s} />;
  if (type === "weight") return <Scale size={12} style={s} />;
  return <UtensilsCrossed size={12} style={s} />;
}

function getLogLabel(log) {
  if (log.type === "food" && log.parse?.food) {
    return log.parse.food.map((f) => f.dish || `${f.size} ${f.dish}`).join(", ");
  }
  if (log.type === "activity") return log.label || (log.parse && log.parse.label) || "Activity logged";
  if (log.type === "water") return `${log.parse?.water_glasses || 1} Glass of Water`;
  if (log.type === "weight") return `Logged weight: ${log.parse?.weight_kg} kg`;
  return log.label || "Log entry";
}

export default Trends;
