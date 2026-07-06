// Home screen dashboard: proactive lines, marker cards, daily stats, trackers, and logging history

import React, { useEffect, useState } from "react";
import { TOKENS } from "../tokens.js";
import { apiFetch } from "../lib/api.js";
import { RangeBar } from "../components/RangeBar.jsx";
import { Label } from "../components/Label.jsx";
import { t } from "../lib/copy.js";
import { Plus, Flame, Sparkles, Activity, PlusCircle, Droplet, Footprints } from "lucide-react";

export function Home({ onNavigateToReport }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addingWater, setAddingWater] = useState(false);
  const [addingWeight, setAddingWeight] = useState(false);
  const [weightInput, setWeightInput] = useState("");

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/home");
      setData(res);
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

  const cardStyle = {
    background: TOKENS.colors.surface,
    borderRadius: TOKENS.borderRadius.card,
    padding: "20px",
    boxShadow: TOKENS.shadows.card,
    marginBottom: "20px",
    border: `1px solid ${TOKENS.colors.border}`
  };

  const headerTitle = {
    fontFamily: TOKENS.fonts.assistant,
    fontSize: "24px",
    fontWeight: "normal",
    color: TOKENS.colors.primary,
    margin: "0 0 4px 0"
  };

  return (
    <div style={{ fontFamily: TOKENS.fonts.data, color: TOKENS.colors.textDark, paddingBottom: "80px" }}>
      {/* Date & Greeting */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={headerTitle}>Namaste</h1>
        <div style={{ fontSize: "14px", color: TOKENS.colors.textMuted }}>
          {new Date().toLocaleDateString("en-IN", { weekday: 'long', month: 'short', day: 'numeric' })}
        </div>
      </div>

      {/* Proactive line (serif font) */}
      <div style={{
        ...cardStyle,
        background: TOKENS.colors.primaryLight,
        borderColor: `${TOKENS.colors.primary}15`,
        display: "flex",
        alignItems: "flex-start",
        gap: "12px"
      }}>
        <Sparkles size={20} style={{ color: TOKENS.colors.primary, flexShrink: 0, marginTop: "2px" }} />
        <p style={{
          fontFamily: TOKENS.fonts.assistant,
          fontSize: "16px",
          fontStyle: "italic",
          color: TOKENS.colors.primary,
          margin: 0,
          lineHeight: "1.4"
        }}>
          {proactive_line}
        </p>
      </div>

      {/* Flagged Markers or Invitation Card */}
      <div style={{ marginBottom: "28px" }}>
        <h2 style={{ fontSize: "15px", fontWeight: 600, color: TOKENS.colors.textMuted, marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          From Your Report
        </h2>
        
        {flagged_markers && flagged_markers.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {flagged_markers.map((marker) => (
              <div key={marker.id} style={cardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <div style={{ fontWeight: 600, fontSize: "15px" }}>{marker.marker_id.toUpperCase()}</div>
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
                  <span style={{ fontSize: "11px", color: TOKENS.colors.textMuted }}>
                    {t("home.honestyCap")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div 
            style={{ 
              ...cardStyle, 
              border: `1px dashed ${TOKENS.colors.primary}50`, 
              cursor: "pointer", 
              textAlign: "center",
              padding: "32px 20px"
            }}
            onClick={onNavigateToReport}
          >
            <Sparkles size={24} style={{ color: TOKENS.colors.primary, margin: "0 auto 12px auto" }} />
            <p style={{ fontSize: "14px", fontWeight: 500, margin: "0 0 4px 0", color: TOKENS.colors.primary }}>
              {t("home.invitationState")}
            </p>
            <p style={{ fontSize: "12px", color: TOKENS.colors.textMuted, margin: 0 }}>
              Scans your bloodwork and connects it to what's on your thali.
            </p>
          </div>
        )}
      </div>

      {/* Today's Intake (RangeBar isProgress={true}) */}
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
          <Flame size={18} style={{ color: TOKENS.colors.primary }} />
          <h3 style={{ fontSize: "16px", fontWeight: 600, margin: 0 }}>Today's Progress</h3>
        </div>

        <RangeBar 
          value={intake_today.calories} 
          target={targets.calories} 
          unit="kcal" 
          isProgress={true} 
        />
        <RangeBar 
          value={intake_today.protein_g} 
          target={targets.protein_g} 
          unit="g Protein" 
          isProgress={true} 
        />
        <RangeBar 
          value={intake_today.fibre_g} 
          target={targets.fibre_g} 
          unit="g Fibre" 
          isProgress={true} 
        />

        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "1fr 1fr", 
          gap: "12px", 
          marginTop: "16px", 
          paddingTop: "16px", 
          borderTop: `1px solid ${TOKENS.colors.border}`, 
          fontSize: "12px", 
          color: TOKENS.colors.textMuted 
        }}>
          <div>Carbs: <strong style={{ color: TOKENS.colors.textDark }}>{intake_today.carbs_g} g</strong></div>
          <div>Fat: <strong style={{ color: TOKENS.colors.textDark }}>{intake_today.fat_g} g</strong></div>
        </div>
      </div>

      {/* Tracker Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
        {/* Water card */}
        <div style={{ ...cardStyle, marginBottom: 0, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: "11px", color: TOKENS.colors.textMuted, textTransform: "uppercase" }}>Water</div>
              <div style={{ fontSize: "20px", fontWeight: "bold", color: TOKENS.colors.water, marginTop: "4px" }}>
                {intake_today.water_glasses} <span style={{ fontSize: "12px", fontWeight: "normal" }}>glasses</span>
              </div>
            </div>
            <Droplet size={20} style={{ color: TOKENS.colors.water }} />
          </div>
          <button 
            onClick={handleQuickAddWater}
            disabled={addingWater}
            style={{
              marginTop: "16px",
              width: "100%",
              padding: "8px",
              background: `${TOKENS.colors.water}15`,
              color: TOKENS.colors.water,
              border: "none",
              borderRadius: "8px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px"
            }}
          >
            <Plus size={14} /> Add 1 Glass
          </button>
        </div>

        {/* Weight card */}
        <div style={{ ...cardStyle, marginBottom: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
            <div>
              <div style={{ fontSize: "11px", color: TOKENS.colors.textMuted, textTransform: "uppercase" }}>Weight</div>
              <div style={{ fontSize: "20px", fontWeight: "bold", color: TOKENS.colors.weight, marginTop: "4px" }}>
                {data.weight_kg ?? "—"} <span style={{ fontSize: "12px", fontWeight: "normal" }}>kg</span>
              </div>
            </div>
            <Activity size={20} style={{ color: TOKENS.colors.weight }} />
          </div>
          
          <form onSubmit={handleQuickAddWeight} style={{ display: "flex", gap: "6px" }}>
            <input 
              style={{
                width: "100%",
                padding: "8px 10px",
                fontSize: "12px",
                border: `1px solid ${TOKENS.colors.border}`,
                borderRadius: "8px",
                outline: "none"
              }}
              type="number"
              step="0.1"
              placeholder="Update..."
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
            />
            <button 
              type="submit"
              disabled={addingWeight}
              style={{
                padding: "8px",
                background: TOKENS.colors.weight,
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer"
              }}
            >
              <Plus size={14} />
            </button>
          </form>
        </div>
      </div>

      {/* Logged Today List */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: "15px", fontWeight: 600, color: TOKENS.colors.textMuted, marginBottom: "16px", textTransform: "uppercase" }}>
          Logged Today
        </h3>
        
        {logs_today && logs_today.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {logs_today.map((log) => (
              <div 
                key={log.id} 
                style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center", 
                  paddingBottom: "12px", 
                  borderBottom: `1px solid ${TOKENS.colors.border}`,
                  fontSize: "13px"
                }}
              >
                <div>
                  <div style={{ fontWeight: 500 }}>
                    {log.type === "food" && log.parse?.food?.map(f => `${f.size} ${f.dish}`).join(", ")}
                    {log.type === "water" && `${log.parse?.water_glasses} Glass of Water`}
                    {log.type === "weight" && `Logged weight: ${log.parse?.weight_kg} kg`}
                  </div>
                  <div style={{ fontSize: "11px", color: TOKENS.colors.textMuted, marginTop: "2px" }}>
                    {new Date(log.ts).toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit', hour12: true })}
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
export default Home;
