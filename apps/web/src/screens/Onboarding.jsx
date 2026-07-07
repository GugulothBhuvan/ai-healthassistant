// Onboarding screen: 3-step wizard

import React, { useState } from "react";
import { TOKENS } from "../tokens.js";
import { apiFetch } from "../lib/api.js";
import { t } from "../lib/copy.js";
import { RangeBar } from "../components/RangeBar.jsx";
import { Label } from "../components/Label.jsx";
import { Upload, ArrowRight } from "lucide-react";

export function Onboarding({ onCompleted }) {
  const [step, setStep] = useState(1);
  const [height, setHeight] = useState(170);
  const [weight, setWeight] = useState(65);
  const [age, setAge] = useState(30);
  const [sex, setSex] = useState("female");
  
  const [diet, setDiet] = useState("vegetarian");
  const [activity, setActivity] = useState("somewhere_between");
  
  const [computedTargets, setComputedTargets] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isReportUploading, setIsReportUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

  const calculateLocalTargets = () => {
    // Mifflin-St Jeor BMR
    let bmr = 10 * weight + 6.25 * height - 5 * age;
    if (sex === "male") bmr += 5;
    else bmr -= 161;

    let factor = 1.2;
    if (activity === "somewhere_between") factor = 1.375;
    else if (activity === "on_my_feet") factor = 1.55;

    const calories = Math.round(bmr * factor);
    const protein_g = Math.round(0.9 * weight * 10) / 10;
    const fibre_g = 30;

    return { calories, protein_g, fibre_g };
  };

  const handleNextStep1 = () => {
    setStep(2);
  };

  const handleNextStep2 = async () => {
    setLoading(true);
    const profileData = {
      height_cm: Number(height),
      weight_kg: Number(weight),
      age: Number(age),
      sex,
      diet,
      activity
    };

    try {
      const data = await apiFetch("/onboarding", {
        method: "POST",
        body: profileData
      });
      setComputedTargets(data.targets);
      setStep(3);
    } catch (err) {
      console.error("Onboarding API error, calculating locally:", err);
      // Fallback to local calculations if API fails in dev mode
      setComputedTargets(calculateLocalTargets());
      setStep(3);
    } finally {
      setLoading(false);
    }
  };

  const handleReportUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsReportUploading(true);
    setUploadStatus("Uploading your panel...");

    const formData = new FormData();
    formData.append("file", file);
    // Explicit purpose limitation consent scope
    formData.append("consent_scope", "DPDP consent: Processing lab report for nutrient gap matching and personal diet insights only.");

    try {
      const uploadRes = await apiFetch("/reports", {
        method: "POST",
        body: formData
      });

      setUploadStatus("Reading markers... Success.");
      setTimeout(() => {
        onCompleted(computedTargets, uploadRes.report_id);
      }, 1000);
    } catch (err) {
      console.error("Report upload failed during onboarding:", err);
      setUploadStatus("Extraction failed. You can upload again later.");
      setTimeout(() => {
        onCompleted(computedTargets, null);
      }, 1500);
    } finally {
      setIsReportUploading(false);
    }
  };

  const handleSkipReport = () => {
    onCompleted(computedTargets, null);
  };

  const containerStyle = {
    maxWidth: "480px",
    margin: "40px auto",
    padding: "32px",
    background: TOKENS.colors.surface,
    borderRadius: TOKENS.borderRadius.card,
    boxShadow: TOKENS.shadows.card,
    fontFamily: TOKENS.fonts.data,
    color: TOKENS.colors.textDark
  };

  const titleStyle = {
    fontFamily: TOKENS.fonts.assistant,
    fontSize: "26px",
    fontWeight: "normal",
    color: TOKENS.colors.primary,
    marginBottom: "8px",
    textAlign: "center"
  };

  const subtitleStyle = {
    fontSize: "14px",
    color: TOKENS.colors.textMuted,
    marginBottom: "32px",
    textAlign: "center"
  };

  const formGroupStyle = {
    marginBottom: "24px"
  };

  const labelStyle = {
    display: "block",
    fontSize: "13px",
    fontWeight: 600,
    color: TOKENS.colors.textDark,
    marginBottom: "8px"
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    fontSize: "15px",
    border: `1px solid ${TOKENS.colors.border}`,
    borderRadius: TOKENS.borderRadius.input,
    background: TOKENS.colors.bg,
    color: TOKENS.colors.textDark,
    outline: "none",
    boxSizing: "border-box"
  };

  const buttonStyle = {
    width: "100%",
    padding: "14px",
    fontSize: "15px",
    fontWeight: 600,
    background: TOKENS.colors.primary,
    color: "#ffffff",
    border: "none",
    borderRadius: TOKENS.borderRadius.input,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    marginTop: "16px",
    transition: "background 0.2s ease"
  };

  const selectionGrid = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginBottom: "12px"
  };

  const selectCard = (isSelected) => ({
    padding: "14px",
    borderRadius: TOKENS.borderRadius.input,
    border: `2px solid ${isSelected ? TOKENS.colors.primary : TOKENS.colors.border}`,
    background: isSelected ? TOKENS.colors.primaryLight : "#ffffff",
    color: TOKENS.colors.textDark,
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
    textAlign: "center",
    transition: "all 0.2s ease"
  });

  return (
    <div style={containerStyle}>
      {step === 1 && (
        <div>
          <h1 style={titleStyle}>Tell us about your body</h1>
          <p style={subtitleStyle}>We only use this to estimate your daily nutrient needs.</p>
          
          <div style={formGroupStyle}>
            <label style={labelStyle}>Sex</label>
            <div style={selectionGrid}>
              <div 
                style={selectCard(sex === "female")} 
                onClick={() => setSex("female")}
              >
                Female
              </div>
              <div 
                style={selectCard(sex === "male")} 
                onClick={() => setSex("male")}
              >
                Male
              </div>
            </div>
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Age (Years)</label>
            <input 
              style={inputStyle} 
              type="number" 
              value={age} 
              onChange={(e) => setAge(e.target.value)} 
              min="1" 
              max="120"
            />
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Height (cm)</label>
            <input 
              style={inputStyle} 
              type="number" 
              value={height} 
              onChange={(e) => setHeight(e.target.value)} 
              min="100" 
              max="250"
            />
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Weight (kg)</label>
            <input 
              style={inputStyle} 
              type="number" 
              value={weight} 
              onChange={(e) => setWeight(e.target.value)} 
              min="30" 
              max="200"
            />
          </div>

          <button style={buttonStyle} onClick={handleNextStep1}>
            Next <ArrowRight size={18} />
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
          <h1 style={titleStyle}>Your habits</h1>
          <p style={subtitleStyle}>Help us customize our guidance to your plate.</p>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Dietary Pattern</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
              <div 
                style={selectCard(diet === "vegetarian")} 
                onClick={() => setDiet("vegetarian")}
              >
                Veg
              </div>
              <div 
                style={selectCard(diet === "eggs_ok")} 
                onClick={() => setDiet("eggs_ok")}
              >
                Eggs Ok
              </div>
              <div 
                style={selectCard(diet === "non_veg")} 
                onClick={() => setDiet("non_veg")}
              >
                Non-Veg
              </div>
            </div>
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Activity Level</label>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div 
                style={{ ...selectCard(activity === "mostly_sitting"), textAlign: "left" }} 
                onClick={() => setActivity("mostly_sitting")}
              >
                💻 Mostly sitting (desk job)
              </div>
              <div 
                style={{ ...selectCard(activity === "somewhere_between"), textAlign: "left" }} 
                onClick={() => setActivity("somewhere_between")}
              >
                🚶 Somewhere between
              </div>
              <div 
                style={{ ...selectCard(activity === "on_my_feet"), textAlign: "left" }} 
                onClick={() => setActivity("on_my_feet")}
              >
                🏃 On my feet a lot
              </div>
            </div>
          </div>

          <button 
            style={buttonStyle} 
            onClick={handleNextStep2} 
            disabled={loading}
          >
            {loading ? "Computing targets..." : "See Targets"} <ArrowRight size={18} />
          </button>
        </div>
      )}

      {step === 3 && computedTargets && (
        <div>
          <h1 style={titleStyle}>Your Daily Targets</h1>
          <p style={subtitleStyle}>Derived directly from your metrics.</p>

          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "10px",
            background: TOKENS.colors.bg,
            padding: "16px",
            borderRadius: TOKENS.borderRadius.input,
            marginBottom: "28px",
            textAlign: "center"
          }}>
            <div>
              <div style={{ fontSize: "11px", color: TOKENS.colors.textMuted }}>Calories</div>
              <div style={{ fontSize: "18px", fontWeight: "bold", color: TOKENS.colors.primary }}>{computedTargets.calories} kcal</div>
            </div>
            <div>
              <div style={{ fontSize: "11px", color: TOKENS.colors.textMuted }}>Protein</div>
              <div style={{ fontSize: "18px", fontWeight: "bold", color: TOKENS.colors.primary }}>{computedTargets.protein_g} g</div>
            </div>
            <div>
              <div style={{ fontSize: "11px", color: TOKENS.colors.textMuted }}>Fibre</div>
              <div style={{ fontSize: "18px", fontWeight: "bold", color: TOKENS.colors.primary }}>{computedTargets.fibre_g} g</div>
            </div>
          </div>

          {/* Value-first report moment: show what a linked report unlocks */}
          <div style={{
            background: TOKENS.gradients.hero,
            borderRadius: TOKENS.borderRadius.lg,
            padding: "22px",
            boxShadow: TOKENS.shadows.hero,
            color: TOKENS.colors.textInverse,
            textAlign: "center"
          }}>
            <h2 style={{ fontFamily: TOKENS.fonts.assistant, fontSize: "20px", fontWeight: "normal", margin: "0 0 8px", color: TOKENS.colors.textInverse }}>
              {t("onboarding.reportValueTitle")}
            </h2>
            <p style={{ fontSize: "13px", color: TOKENS.colors.textInverseMuted, margin: "0 0 18px", lineHeight: 1.45 }}>
              {t("onboarding.reportValueBody")}
            </p>

            {/* Example marker card — clearly labelled as a preview, never presented as live */}
            <div style={{ background: TOKENS.colors.surface, borderRadius: TOKENS.borderRadius.card, padding: "16px", textAlign: "left", color: TOKENS.colors.textDark }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <div style={{ fontWeight: 600, fontSize: "14px" }}>IRON</div>
                <Label text="low gap" type="low" />
              </div>
              <RangeBar value={45} rangeLow={65} rangeHigh={175} unit="µg/dL" />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px", borderTop: `1px solid ${TOKENS.colors.border}`, paddingTop: "10px" }}>
                <Label text="food fixable" type="food_fixable" />
                <span style={{ fontSize: "10px", color: TOKENS.colors.textMuted }}>{t("onboarding.reportPreviewCaption")}</span>
              </div>
            </div>

            <label style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              marginTop: "18px",
              padding: "13px 24px",
              background: TOKENS.colors.accent,
              color: TOKENS.colors.accentInk,
              borderRadius: TOKENS.borderRadius.pill,
              cursor: isReportUploading ? "not-allowed" : "pointer",
              fontSize: "14px",
              fontWeight: 700
            }}>
              <Upload size={16} />
              {isReportUploading ? "Reading..." : "Upload my report"}
              <input
                type="file"
                accept="application/pdf,image/*"
                style={{ display: "none" }}
                onChange={handleReportUpload}
                disabled={isReportUploading}
              />
            </label>

            {uploadStatus && (
              <div style={{ fontSize: "12px", color: TOKENS.colors.accent, marginTop: "12px", fontWeight: 500 }}>
                {uploadStatus}
              </div>
            )}
          </div>

          {/* One-tap, no-guilt skip (F1·AC4) */}
          <button
            style={{
              ...buttonStyle,
              background: "transparent",
              color: TOKENS.colors.textMuted,
              border: `1px solid ${TOKENS.colors.border}`,
              marginTop: "16px"
            }}
            onClick={handleSkipReport}
          >
            {t("onboarding.reportSkip")}
          </button>
        </div>
      )}
    </div>
  );
}
export default Onboarding;
