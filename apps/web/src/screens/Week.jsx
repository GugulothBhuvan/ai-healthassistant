// Week screen: weekly trend analytics in range-bar grammar with attribution details

import React, { useEffect, useState } from "react";
import { TOKENS } from "../tokens.js";
import { apiFetch } from "../lib/api.js";
import { RangeBar } from "../components/RangeBar.jsx";
import { t } from "../lib/copy.js";
import { Calendar, Activity, Sparkles } from "lucide-react";

export function Week() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchWeekData = async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/week");
      setData(res);
    } catch (err) {
      console.error("Failed to load weekly metrics:", err);
      setError("Unable to load weekly trend data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeekData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "400px", fontFamily: TOKENS.fonts.data, color: TOKENS.colors.textMuted }}>
        Analyzing your week...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "32px", textAlign: "center", fontFamily: TOKENS.fonts.data }}>
        <p style={{ color: TOKENS.colors.doctorsTerritory, fontWeight: 500 }}>{error}</p>
        <button 
          onClick={fetchWeekData} 
          style={{ padding: "10px 16px", background: TOKENS.colors.primary, color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", marginTop: "12px" }}
        >
          Retry
        </button>
      </div>
    );
  }

  const { targets, days, attribution } = data;

  const cardStyle = {
    background: TOKENS.colors.surface,
    borderRadius: TOKENS.borderRadius.card,
    padding: "20px",
    boxShadow: TOKENS.shadows.card,
    marginBottom: "20px",
    border: `1px solid ${TOKENS.colors.border}`
  };

  // Compute weekly average
  const totalCal = days.reduce((acc, day) => acc + day.calories, 0);
  const totalProt = days.reduce((acc, day) => acc + day.protein_g, 0);
  const totalFibre = days.reduce((acc, day) => acc + day.fibre_g, 0);
  
  const avgCal = Math.round(totalCal / 7);
  const avgProt = Math.round((totalProt / 7) * 10) / 10;
  const avgFibre = Math.round((totalFibre / 7) * 10) / 10;

  return (
    <div style={{ fontFamily: TOKENS.fonts.data, color: TOKENS.colors.textDark, paddingBottom: "80px" }}>
      {/* Page Title */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontFamily: TOKENS.fonts.assistant, fontSize: "24px", fontWeight: "normal", color: TOKENS.colors.primary, margin: 0 }}>
          Weekly Summary
        </h1>
        <div style={{ fontSize: "14px", color: TOKENS.colors.textMuted }}>
          Evaluating your target closure trends
        </div>
      </div>

      {/* Attribution Card */}
      <div style={{
        ...cardStyle,
        background: TOKENS.colors.primaryLight,
        borderColor: `${TOKENS.colors.primary}15`,
        display: "flex",
        alignItems: "flex-start",
        gap: "12px"
      }}>
        <Sparkles size={20} style={{ color: TOKENS.colors.primary, flexShrink: 0, marginTop: "2px" }} />
        <div>
          <h3 style={{ fontSize: "14px", fontWeight: 600, color: TOKENS.colors.primary, margin: "0 0 4px 0" }}>Gap Closure Analysis</h3>
          <p style={{ fontSize: "14px", color: TOKENS.colors.primary, margin: 0, lineHeight: "1.4" }}>
            {attribution}
          </p>
        </div>
      </div>

      {/* Weekly Averages */}
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
          <Activity size={18} style={{ color: TOKENS.colors.primary }} />
          <h3 style={{ fontSize: "16px", fontWeight: 600, margin: 0 }}>Weekly Averages</h3>
        </div>

        <RangeBar 
          value={avgCal} 
          target={targets.calories} 
          unit="kcal" 
          isProgress={true} 
        />
        <RangeBar 
          value={avgProt} 
          target={targets.protein_g} 
          unit="g Protein" 
          isProgress={true} 
        />
        <RangeBar 
          value={avgFibre} 
          target={targets.fibre_g} 
          unit="g Fibre" 
          isProgress={true} 
        />
      </div>

      {/* 7-Day breakdown */}
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
          <Calendar size={18} style={{ color: TOKENS.colors.primary }} />
          <h3 style={{ fontSize: "16px", fontWeight: 600, margin: 0 }}>Past 7 Days</h3>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {days.map((day) => {
            const dateObj = new Date(day.date);
            const dayName = dateObj.toLocaleDateString("en-IN", { weekday: 'short' });
            const dayNum = dateObj.toLocaleDateString("en-IN", { day: 'numeric' });
            
            const isToday = new Date().toISOString().split("T")[0] === day.date;

            return (
              <div 
                key={day.date} 
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  background: isToday ? `${TOKENS.colors.primaryLight}40` : "transparent",
                  border: isToday ? `1px solid ${TOKENS.colors.primary}20` : "none"
                }}
              >
                <div style={{ width: "60px" }}>
                  <div style={{ fontWeight: 600, fontSize: "14px" }}>{dayName}</div>
                  <div style={{ fontSize: "11px", color: TOKENS.colors.textMuted }}>{dayNum}</div>
                </div>

                <div style={{ flex: 1, display: "flex", justifyContent: "space-around", fontSize: "13px" }}>
                  <div>
                    <span style={{ fontSize: "10px", color: TOKENS.colors.textMuted, display: "block" }}>Cal</span>
                    <strong>{day.calories}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "10px", color: TOKENS.colors.textMuted, display: "block" }}>Prot</span>
                    <strong>{day.protein_g}g</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "10px", color: TOKENS.colors.textMuted, display: "block" }}>Fibre</span>
                    <strong>{day.fibre_g}g</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "10px", color: TOKENS.colors.textMuted, display: "block" }}>Water</span>
                    <strong>{day.water_glasses} gl</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Disclaimers */}
      <div style={{ textAlign: "center", padding: "12px", color: TOKENS.colors.textMuted, fontSize: "12px" }}>
        {t("home.honestyCap")}
      </div>
    </div>
  );
}
export default Week;
