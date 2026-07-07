// Home screen dashboard: hero greeting + proactive line, report markers with
// tap-to-expand food guidance (F2), weekly energy trend, daily intake, trackers,
// and logging history. Hierarchy holds F5: marker layer ranked above macros.

import React, { useEffect, useState } from "react";
import { TOKENS } from "../tokens.js";
import { apiFetch } from "../lib/api.js";
import { RangeBar } from "../components/RangeBar.jsx";
import { TrendChart } from "../components/TrendChart.jsx";
import { Label } from "../components/Label.jsx";
import { t } from "../lib/copy.js";
import { Plus, Flame, Sparkles, Activity, Droplet, ChevronDown, TrendingUp, FileUp } from "lucide-react";

// Resolve the diet-aware guidance copy key for a flagged marker.
function guidanceKey(markerId, diet) {
  if (markerId === "iron") return diet === "vegetarian" ? "guidance.iron.veg" : "guidance.iron.nonveg";
  if (markerId === "vitamin_d") return "guidance.vitamin_d.default";
  if (markerId === "hba1c") return "guidance.hba1c.default";
  return "guidance.generic";
}

export function Home({ onNavigateToReport }) {
  const [data, setData] = useState(null);
  const [week, setWeek] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addingWater, setAddingWater] = useState(false);
  const [addingWeight, setAddingWeight] = useState(false);
  const [weightInput, setWeightInput] = useState("");
  const [expandedMarker, setExpandedMarker] = useState(null);

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      // Home is the primary payload; the week trend is best-effort decoration.
      const [home, weekRes] = await Promise.all([
        apiFetch("/home"),
        apiFetch("/week").catch(() => null)
      ]);
      setData(home);
      setWeek(weekRes);
    } catch (err) {
      console.error("Failed to load home data:", err);
      setError("Unable to load metrics. Make sure the API is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeData();
  }, []);

  const handleQuickAddWater = async () => {
    if (addingWater) return;
    setAddingWater(true);
    try {
      // Create confirm token or request a direct mock confirm for water log
      const res = await apiFetch("/assistant/exchange", {
        method: "POST",
        body: { text: "piya 1 glass paani" }
      });
      if (res.confirm_token) {
        await apiFetch("/assistant/confirm", {
          method: "POST",
          body: { confirm_token: res.confirm_token }
        });
        await fetchHomeData();
      }
    } catch (err) {
      console.error("Quick log water failed:", err);
      alert("Failed to log water.");
    } finally {
      setAddingWater(false);
    }
  };

  const handleQuickAddWeight = async (e) => {
    e.preventDefault();
    if (!weightInput || addingWeight) return;
    setAddingWeight(true);
    try {
      const res = await apiFetch("/assistant/exchange", {
        method: "POST",
        body: { text: `weight is ${weightInput} kg` }
      });
      if (res.confirm_token) {
        await apiFetch("/assistant/confirm", {
          method: "POST",
          body: { confirm_token: res.confirm_token }
        });
        setWeightInput("");
        setAddingWeight(false);
        await fetchHomeData();
      }
    } catch (err) {
      console.error("Quick log weight failed:", err);
      alert("Failed to log weight.");
      setAddingWeight(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "400px", fontFamily: TOKENS.fonts.data, color: TOKENS.colors.textMuted }}>
        Loading your day...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "32px", textAlign: "center", fontFamily: TOKENS.fonts.data }}>
        <p style={{ color: TOKENS.colors.doctorsTerritory, fontWeight: 500 }}>{error}</p>
        <button
          onClick={fetchHomeData}
          style={{ padding: "10px 16px", background: TOKENS.colors.primary, color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", marginTop: "12px" }}
        >
          Retry
        </button>
      </div>
    );
  }

  const { targets, intake_today, flagged_markers, logs_today, proactive_line, diet } = data;

  // Build the weekly energy series (best-effort). Hidden if the week call failed.
  const trendData = week && Array.isArray(week.days)
    ? week.days.map((d) => ({
        label: new Date(d.date).toLocaleDateString("en-IN", { weekday: "short" }).slice(0, 3),
        value: d.calories || 0
      }))
    : [];
  const hasTrend = trendData.some((d) => d.value > 0);

  const cardStyle = {
    background: TOKENS.colors.surface,
    borderRadius: TOKENS.borderRadius.card,
    padding: "20px",
    boxShadow: TOKENS.shadows.card,
    marginBottom: "16px",
    border: `1px solid ${TOKENS.colors.border}`
  };

  return (
    <div style={{ fontFamily: TOKENS.fonts.data, color: TOKENS.colors.textDark, paddingBottom: "88px" }}>
      <style>{`
        @keyframes aRise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .a-rise { animation: aRise 0.5s cubic-bezier(0.16,1,0.3,1) both; }
      `}</style>

      {/* HERO — greeting + assistant's daily line (serif = assistant) */}
      <div className="a-rise" style={{
        background: TOKENS.gradients.hero,
        borderRadius: TOKENS.borderRadius.lg,
        padding: "22px 22px 24px",
        marginBottom: "16px",
        boxShadow: TOKENS.shadows.hero,
        color: TOKENS.colors.textInverse
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontFamily: TOKENS.fonts.assistant, fontSize: TOKENS.type.h1, fontWeight: "normal", margin: 0, color: TOKENS.colors.textInverse }}>
              Namaste
            </h1>
            <div style={{ fontSize: TOKENS.type.caption, color: TOKENS.colors.textInverseMuted, marginTop: "2px" }}>
              {new Date().toLocaleDateString("en-IN", { weekday: "long", month: "short", day: "numeric" })}
            </div>
          </div>
          <div style={{
            width: "40px", height: "40px", borderRadius: TOKENS.borderRadius.pill,
            background: "rgba(231,226,156,0.16)", display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <Sparkles size={18} style={{ color: TOKENS.colors.accent }} />
          </div>
        </div>

        <p style={{
          fontFamily: TOKENS.fonts.assistant,
          fontSize: "17px",
          fontStyle: "italic",
          lineHeight: 1.4,
          margin: "18px 0 0",
          color: TOKENS.colors.textInverse
        }}>
          {proactive_line}
        </p>
      </div>

      {/* FROM YOUR REPORT — marker cards (tap to expand) or invitation. Ranked above macros. */}
      <div className="a-rise" style={{ marginBottom: "20px" }}>
        <SectionHeader>{t("home.markersTitle")}</SectionHeader>

        {flagged_markers && flagged_markers.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {flagged_markers.map((marker) => {
              const open = expandedMarker === marker.id;
              return (
                <div
                  key={marker.id}
                  style={{ ...cardStyle, marginBottom: 0, cursor: "pointer", boxShadow: open ? TOKENS.shadows.elevated : TOKENS.shadows.card, transition: `box-shadow ${TOKENS.motion.base} ${TOKENS.motion.ease}` }}
                  onClick={() => setExpandedMarker(open ? null : marker.id)}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <div style={{ fontWeight: 600, fontSize: "15px" }}>{marker.marker_id.replace("_", " ").toUpperCase()}</div>
                    <Label
                      text={marker.flag === "low" ? "low gap" : "excessive"}
                      type={marker.flag === "low" ? "low" : "high"}
                    />
                  </div>

                  <RangeBar
                    value={Number(marker.value)}
                    rangeLow={Number(marker.range_low)}
                    rangeHigh={Number(marker.range_high)}
                    unit={marker.unit}
                  />

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", borderTop: `1px solid ${TOKENS.colors.border}`, paddingTop: "12px" }}>
                    <Label text={marker.verdict_class.replace("_", " ")} type={marker.verdict_class} />
                    <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: TOKENS.type.micro, color: TOKENS.colors.textMuted }}>
                      {t("home.tapForFoods")}
                      <ChevronDown size={13} style={{ transform: open ? "rotate(180deg)" : "none", transition: `transform ${TOKENS.motion.base} ${TOKENS.motion.ease}` }} />
                    </span>
                  </div>

                  {/* Expanded diet-aware food guidance (F2) */}
                  {open && (
                    <div style={{ marginTop: "12px", padding: "12px 14px", background: TOKENS.gradients.invitation, borderRadius: TOKENS.borderRadius.sm }}>
                      <p style={{ fontFamily: TOKENS.fonts.assistant, fontSize: "14px", fontStyle: "italic", color: TOKENS.colors.primary, margin: 0, lineHeight: 1.4 }}>
                        {t(guidanceKey(marker.marker_id, diet))}
                      </p>
                      <p style={{ fontSize: TOKENS.type.micro, color: TOKENS.colors.textMuted, margin: "8px 0 0" }}>
                        {t("home.honestyCap")}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div
            style={{
              ...cardStyle,
              marginBottom: 0,
              background: TOKENS.gradients.invitation,
              border: `1px dashed ${TOKENS.colors.primary}45`,
              cursor: "pointer",
              textAlign: "center",
              padding: "28px 22px"
            }}
            onClick={onNavigateToReport}
          >
            <div style={{
              width: "44px", height: "44px", margin: "0 auto 14px", borderRadius: TOKENS.borderRadius.pill,
              background: TOKENS.colors.surface, display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: TOKENS.shadows.card
            }}>
              <FileUp size={20} style={{ color: TOKENS.colors.primary }} />
            </div>
            <p style={{ fontSize: "15px", fontWeight: 600, margin: "0 0 6px", color: TOKENS.colors.primary }}>
              {t("home.invitationState")}
            </p>
            <p style={{ fontSize: TOKENS.type.caption, color: TOKENS.colors.textMuted, margin: "0 0 16px", lineHeight: 1.4 }}>
              Scans your bloodwork and connects it to what's on your thali.
            </p>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: "6px", padding: "9px 18px",
              background: TOKENS.colors.primary, color: "#fff", borderRadius: TOKENS.borderRadius.pill,
              fontSize: TOKENS.type.body, fontWeight: 600
            }}>
              <Plus size={15} /> Add a report
            </span>
          </div>
        )}
      </div>

      {/* WEEKLY ENERGY TREND (macro-side, ranked below markers) */}
      {hasTrend && (
        <div className="a-rise" style={{
          background: TOKENS.gradients.hero,
          borderRadius: TOKENS.borderRadius.lg,
          padding: "18px 16px 12px",
          marginBottom: "16px",
          boxShadow: TOKENS.shadows.hero,
          color: TOKENS.colors.textInverse
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "0 6px", marginBottom: "6px" }}>
            <TrendingUp size={16} style={{ color: TOKENS.colors.accent }} />
            <h3 style={{ fontSize: TOKENS.type.h3, fontWeight: 600, margin: 0, color: TOKENS.colors.textInverse }}>
              {t("home.trendTitle")}
            </h3>
          </div>
          <TrendChart data={trendData} highlightIndex={trendData.length - 1} unit="kcal" />
        </div>
      )}

      {/* TODAY'S PROGRESS (macros) */}
      <div className="a-rise" style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
          <Flame size={18} style={{ color: TOKENS.colors.primary }} />
          <h3 style={{ fontSize: TOKENS.type.h3, fontWeight: 600, margin: 0 }}>{t("home.intakeTitle")}</h3>
        </div>

        <RangeBar value={intake_today.calories} target={targets.calories} unit="kcal" isProgress={true} />
        <RangeBar value={intake_today.protein_g} target={targets.protein_g} unit="g Protein" isProgress={true} />
        <RangeBar value={intake_today.fibre_g} target={targets.fibre_g} unit="g Fibre" isProgress={true} />

        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "16px",
          paddingTop: "16px", borderTop: `1px solid ${TOKENS.colors.border}`, fontSize: TOKENS.type.caption, color: TOKENS.colors.textMuted
        }}>
          <div>Carbs: <strong style={{ color: TOKENS.colors.textDark }}>{intake_today.carbs_g} g</strong></div>
          <div>Fat: <strong style={{ color: TOKENS.colors.textDark }}>{intake_today.fat_g} g</strong></div>
        </div>
      </div>

      {/* TRACKERS */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
        {/* Water */}
        <div style={{ ...cardStyle, marginBottom: 0, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: TOKENS.type.micro, color: TOKENS.colors.textMuted, textTransform: "uppercase", letterSpacing: "0.4px" }}>Water</div>
              <div style={{ fontSize: "22px", fontWeight: "bold", color: TOKENS.colors.water, marginTop: "4px" }}>
                {intake_today.water_glasses} <span style={{ fontSize: "12px", fontWeight: "normal" }}>glasses</span>
              </div>
            </div>
            <Droplet size={20} style={{ color: TOKENS.colors.water }} />
          </div>
          <button
            onClick={handleQuickAddWater}
            disabled={addingWater}
            style={{
              marginTop: "16px", width: "100%", padding: "9px", background: `${TOKENS.colors.water}15`,
              color: TOKENS.colors.water, border: "none", borderRadius: TOKENS.borderRadius.sm, fontWeight: 600,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px"
            }}
          >
            <Plus size={14} /> Add 1 Glass
          </button>
        </div>

        {/* Weight */}
        <div style={{ ...cardStyle, marginBottom: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
            <div>
              <div style={{ fontSize: TOKENS.type.micro, color: TOKENS.colors.textMuted, textTransform: "uppercase", letterSpacing: "0.4px" }}>Weight</div>
              <div style={{ fontSize: "22px", fontWeight: "bold", color: TOKENS.colors.weight, marginTop: "4px" }}>
                {data.weight_kg ?? "—"} <span style={{ fontSize: "12px", fontWeight: "normal" }}>kg</span>
              </div>
            </div>
            <Activity size={20} style={{ color: TOKENS.colors.weight }} />
          </div>

          <form onSubmit={handleQuickAddWeight} style={{ display: "flex", gap: "6px" }}>
            <input
              style={{ width: "100%", padding: "9px 10px", fontSize: "12px", border: `1px solid ${TOKENS.colors.border}`, borderRadius: TOKENS.borderRadius.sm, outline: "none" }}
              type="number"
              step="0.1"
              placeholder="Update..."
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
            />
            <button
              type="submit"
              disabled={addingWeight}
              style={{ padding: "9px", background: TOKENS.colors.weight, color: "#fff", border: "none", borderRadius: TOKENS.borderRadius.sm, cursor: "pointer" }}
            >
              <Plus size={14} />
            </button>
          </form>
        </div>
      </div>

      {/* LOGGED TODAY */}
      <div style={cardStyle}>
        <SectionHeader>Logged today</SectionHeader>

        {logs_today && logs_today.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {logs_today.map((log) => (
              <div
                key={log.id}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "12px", borderBottom: `1px solid ${TOKENS.colors.border}`, fontSize: "13px" }}
              >
                <div>
                  <div style={{ fontWeight: 500 }}>
                    {log.type === "food" && log.parse?.food?.map((f) => `${f.size} ${f.dish}`).join(", ")}
                    {log.type === "water" && `${log.parse?.water_glasses} Glass of Water`}
                    {log.type === "weight" && `Logged weight: ${log.parse?.weight_kg} kg`}
                  </div>
                  <div style={{ fontSize: TOKENS.type.micro, color: TOKENS.colors.textMuted, marginTop: "2px" }}>
                    {new Date(log.ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
                  </div>
                </div>
                <div style={{ color: TOKENS.colors.primary, fontWeight: 600 }}>
                  {log.type === "food" && `+${Math.round(log.parse?.food?.reduce((acc, f) => acc + (f.nutrients?.calories || 0), 0))} cal`}
                  {log.type === "water" && `+${log.parse?.water_glasses} Glass`}
                  {log.type === "weight" && `${log.parse?.weight_kg} kg`}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "16px", color: TOKENS.colors.textMuted, fontSize: "13px" }}>
            Nothing logged yet today. Use the composer below.
          </div>
        )}
      </div>
    </div>
  );
}

// Small uppercase section header used across the dashboard.
function SectionHeader({ children }) {
  return (
    <h2 style={{
      fontSize: "13px", fontWeight: 600, color: TOKENS.colors.textMuted,
      margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "0.5px"
    }}>
      {children}
    </h2>
  );
}

export default Home;
