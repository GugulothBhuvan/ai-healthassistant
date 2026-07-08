// Onboarding screen: 6-step guided setup wizard
// Collects demographics, goals, dream weight, tracking checkbox items, dietary habits,
// and recommends targets that the user can directly edit/customize before submitting.

import React, { useState } from "react";
import { TOKENS } from "../tokens.js";
import { apiFetch } from "../lib/api.js";
import { t } from "../lib/copy.js";
import { RangeBar } from "../components/RangeBar.jsx";
import { Label } from "../components/Label.jsx";
import { Upload, ArrowRight, Check, TrendingDown, Dumbbell, ShieldAlert, Heart, Monitor, Footprints, Flame } from "lucide-react";

export function Onboarding({ onCompleted }) {
  const [step, setStep] = useState(1);
  
  // Step 1: Physical Metrics
  const [name, setName] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState(""); // empty by default
  
  // Step 2: Goal & Dream Weight
  const [goal, setGoal] = useState("weight_loss"); // weight_loss | muscle_gain | deficiencies | longevity
  const [dreamWeight, setDreamWeight] = useState("");

  // Step 3: Checkboxes
  const [actions, setActions] = useState(["meals", "markers", "activity", "water", "medicines"]);

  // Step 4: Plate & Habits
  const [diet, setDiet] = useState("vegetarian");
  const [activity, setActivity] = useState("somewhere_between");
  
  // Step 5: Customize Targets
  const [customCalories, setCustomCalories] = useState(1800);
  const [customProtein, setCustomProtein] = useState(55);
  const [customFibre, setCustomFibre] = useState(30);

  // Step 6: Lab report upload
  const [computedTargets, setComputedTargets] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isReportUploading, setIsReportUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

  const calculateLocalTargets = () => {
    // Mifflin-St Jeor BMR
    let bmr = 10 * Number(weight) + 6.25 * Number(height) - 5 * Number(age);
    if (sex === "male") bmr += 5;
    else bmr -= 161;

    let factor = 1.2;
    if (activity === "somewhere_between") factor = 1.375;
    else if (activity === "on_my_feet") factor = 1.55;

    // Adjust calories slightly based on goal
    let calories = Math.round(bmr * factor);
    if (goal === "weight_loss") {
      calories -= 300; // gentle deficit
    } else if (goal === "muscle_gain") {
      calories += 200; // surplus
    }

    const protein_g = Math.round(0.9 * Number(weight) * 10) / 10;
    const fibre_g = 30;

    return { calories, protein_g, fibre_g };
  };

  const handleNextStep1 = () => {
    if (!name || !name.trim()) {
      alert("Please enter your name.");
      return;
    }
    if (!sex) {
      alert("Please select your sex.");
      return;
    }
    if (!age || Number(age) <= 0 || Number(age) > 120) {
      alert("Please enter a valid age between 1 and 120.");
      return;
    }
    if (!height || Number(height) <= 100 || Number(height) > 250) {
      alert("Please enter a valid height between 100 and 250 cm.");
      return;
    }
    if (!weight || Number(weight) <= 30 || Number(weight) > 200) {
      alert("Please enter a valid weight between 30 and 200 kg.");
      return;
    }
    setStep(2);
  };

  const handleNextStep2 = () => {
    if (!dreamWeight || Number(dreamWeight) <= 35 || Number(dreamWeight) > 180) {
      alert("Please enter a valid dream weight between 35 and 180 kg.");
      return;
    }
    setStep(3);
  };

  const toggleAction = (val) => {
    if (actions.includes(val)) {
      setActions(actions.filter(a => a !== val));
    } else {
      setActions([...actions, val]);
    }
  };

  const handleNextStep3 = () => {
    setStep(4);
  };

  const handleNextStep4 = () => {
    const computed = calculateLocalTargets();
    setCustomCalories(computed.calories);
    setCustomProtein(computed.protein_g);
    setCustomFibre(computed.fibre_g);
    setStep(5);
  };

  const handleSubmitOnboarding = async () => {
    setLoading(true);
    const profileData = {
      name: name.trim(),
      height_cm: Number(height),
      weight_kg: Number(weight),
      age: Number(age),
      sex,
      diet,
      activity,
      dream_weight_kg: Number(dreamWeight),
      goal,
      actions,
      custom_targets: {
        calories: Number(customCalories),
        protein_g: Number(customProtein),
        fibre_g: Number(customFibre)
      }
    };

    try {
      const data = await apiFetch("/onboarding", {
        method: "POST",
        body: profileData
      });
      setComputedTargets(data.targets);
      setStep(6);
    } catch (err) {
      console.error("Onboarding API error, saving locally:", err);
      // Fallback in case of local offline / dev mode
      const local = {
        name: name.trim(),
        calories: Number(customCalories),
        protein_g: Number(customProtein),
        fibre_g: Number(customFibre),
        dream_weight_kg: Number(dreamWeight),
        goal,
        actions
      };
      setComputedTargets(local);
      setStep(6);
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
    marginBottom: "28px",
    textAlign: "center",
    lineHeight: 1.55
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
    marginTop: "20px",
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
      {/* Step 1: Body demographics */}
      {step === 1 && (
        <div>
          <h1 style={titleStyle}>Tell us about your body</h1>
          <p style={subtitleStyle}>We use this to estimate your daily base metabolic rate.</p>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Your Name</label>
            <input 
              style={inputStyle} 
              type="text" 
              placeholder="Enter your name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              maxLength="30"
            />
          </div>
          
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
              placeholder="e.g. 28"
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
              placeholder="e.g. 170"
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
              placeholder="e.g. 65"
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

      {/* Step 2: Goal & Dream Weight */}
      {step === 2 && (
        <div>
          <h1 style={titleStyle}>Goals & Dream Weight</h1>
          <p style={subtitleStyle}>Define where you want to go and what weight makes you feel healthiest.</p>

          <div style={formGroupStyle}>
            <label style={labelStyle}>What brought you here?</label>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div 
                style={{ ...selectCard(goal === "weight_loss"), display: "flex", alignItems: "center", gap: "10px", textAlign: "left" }} 
                onClick={() => setGoal("weight_loss")}
              >
                <TrendingDown size={18} style={{ color: goal === "weight_loss" ? TOKENS.colors.primary : TOKENS.colors.textMuted, flexShrink: 0 }} />
                <span>Weight Loss & Management</span>
              </div>
              <div 
                style={{ ...selectCard(goal === "muscle_gain"), display: "flex", alignItems: "center", gap: "10px", textAlign: "left" }} 
                onClick={() => setGoal("muscle_gain")}
              >
                <Dumbbell size={18} style={{ color: goal === "muscle_gain" ? TOKENS.colors.primary : TOKENS.colors.textMuted, flexShrink: 0 }} />
                <span>Muscle Gain & Fitness</span>
              </div>
              <div 
                style={{ ...selectCard(goal === "deficiencies"), display: "flex", alignItems: "center", gap: "10px", textAlign: "left" }} 
                onClick={() => setGoal("deficiencies")}
              >
                <ShieldAlert size={18} style={{ color: goal === "deficiencies" ? TOKENS.colors.primary : TOKENS.colors.textMuted, flexShrink: 0 }} />
                <span>Manage Nutrient Deficiencies</span>
              </div>
              <div 
                style={{ ...selectCard(goal === "longevity"), display: "flex", alignItems: "center", gap: "10px", textAlign: "left" }} 
                onClick={() => setGoal("longevity")}
              >
                <Heart size={18} style={{ color: goal === "longevity" ? TOKENS.colors.primary : TOKENS.colors.textMuted, flexShrink: 0 }} />
                <span>General Health & Longevity</span>
              </div>
            </div>
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Dream Weight (kg)</label>
            <input 
              style={inputStyle} 
              type="number" 
              placeholder="e.g. 60"
              value={dreamWeight} 
              onChange={(e) => setDreamWeight(e.target.value)} 
              min="35" 
              max="180"
            />
          </div>

          <button style={buttonStyle} onClick={handleNextStep2}>
            Next <ArrowRight size={18} />
          </button>
        </div>
      )}

      {/* Step 3: Checkboxes (What do you want to do?) */}
      {step === 3 && (
        <div>
          <h1 style={titleStyle}>What do you want to track?</h1>
          <p style={subtitleStyle}>Choose the main activities you plan to focus on with Aarogya.</p>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
            {[
              { id: "meals", title: "Track meals and nutrition", desc: "Log lunches, breakfasts, and track macronutrient fill rates." },
              { id: "markers", title: "Monitor blood marker deficiencies", desc: "Flag low Iron, Vitamin D, or HbA1c to find diet fixes." },
              { id: "activity", title: "Log activity and active burn", desc: "Tell Aarogya about walks, runs, and physical workouts." },
              { id: "water", title: "Track daily water intake", desc: "Record your hydration cup-by-cup easily." },
              { id: "medicines", title: "Log medications & supplements", desc: "Snap prescriptions to track dosages and weekly adherence." }
            ].map((item) => {
              const checked = actions.includes(item.id);
              return (
                <div 
                  key={item.id}
                  onClick={() => toggleAction(item.id)}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                    padding: "14px",
                    borderRadius: TOKENS.borderRadius.input,
                    border: `2px solid ${checked ? TOKENS.colors.primary : TOKENS.colors.border}`,
                    background: checked ? TOKENS.colors.primaryLight : "#ffffff",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                >
                  <div style={{
                    width: "20px", height: "20px", borderRadius: "4px",
                    border: `2px solid ${checked ? TOKENS.colors.primary : TOKENS.colors.textFaint}`,
                    background: checked ? TOKENS.colors.primary : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, marginTop: "2px"
                  }}>
                    {checked && <Check size={14} style={{ color: "#ffffff" }} />}
                  </div>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: TOKENS.colors.ink }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: "12px", color: TOKENS.colors.textMuted, marginTop: "2px", lineHeight: 1.4 }}>
                      {item.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button style={buttonStyle} onClick={handleNextStep3}>
            Next <ArrowRight size={18} />
          </button>
        </div>
      )}

      {/* Step 4: Plate & Habits */}
      {step === 4 && (
        <div>
          <h1 style={titleStyle}>Diet & Habits</h1>
          <p style={subtitleStyle}>Tell us about your plate and routine so we can adjust suggestions.</p>

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
                style={{ ...selectCard(activity === "mostly_sitting"), display: "flex", alignItems: "center", gap: "10px", textAlign: "left" }} 
                onClick={() => setActivity("mostly_sitting")}
              >
                <Monitor size={18} style={{ color: activity === "mostly_sitting" ? TOKENS.colors.primary : TOKENS.colors.textMuted, flexShrink: 0 }} />
                <span>Mostly sitting (desk job)</span>
              </div>
              <div 
                style={{ ...selectCard(activity === "somewhere_between"), display: "flex", alignItems: "center", gap: "10px", textAlign: "left" }} 
                onClick={() => setActivity("somewhere_between")}
              >
                <Footprints size={18} style={{ color: activity === "somewhere_between" ? TOKENS.colors.primary : TOKENS.colors.textMuted, flexShrink: 0 }} />
                <span>Somewhere between</span>
              </div>
              <div 
                style={{ ...selectCard(activity === "on_my_feet"), display: "flex", alignItems: "center", gap: "10px", textAlign: "left" }} 
                onClick={() => setActivity("on_my_feet")}
              >
                <Flame size={18} style={{ color: activity === "on_my_feet" ? TOKENS.colors.primary : TOKENS.colors.textMuted, flexShrink: 0 }} />
                <span>On my feet a lot</span>
              </div>
            </div>
          </div>

          <button style={buttonStyle} onClick={handleNextStep4}>
            Calculate Targets <ArrowRight size={18} />
          </button>
        </div>
      )}

      {/* Step 5: Customize Targets */}
      {step === 5 && (
        <div>
          <h1 style={titleStyle}>Set Daily Targets</h1>
          <p style={subtitleStyle}>These are calculated based on your Mifflin-St Jeor details, but you must review and input your preferred values.</p>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Daily Calorie Target (kcal)</label>
            <input 
              style={inputStyle}
              type="number"
              value={customCalories}
              onChange={(e) => setCustomCalories(e.target.value)}
              min="1000"
              max="5000"
            />
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Protein Target (g)</label>
            <input 
              style={inputStyle}
              type="number"
              value={customProtein}
              onChange={(e) => setCustomProtein(e.target.value)}
              min="20"
              max="250"
            />
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Fibre Target (g)</label>
            <input 
              style={inputStyle}
              type="number"
              value={customFibre}
              onChange={(e) => setCustomFibre(e.target.value)}
              min="10"
              max="100"
            />
          </div>

          <button 
            style={buttonStyle} 
            onClick={handleSubmitOnboarding} 
            disabled={loading}
          >
            {loading ? "Saving Profile..." : "Confirm targets"} <ArrowRight size={18} />
          </button>
        </div>
      )}

      {/* Step 6: Lab report upload (Optional) */}
      {step === 6 && computedTargets && (
        <div>
          <h1 style={titleStyle}>Your Daily Targets</h1>
          <p style={subtitleStyle}>Derived directly from your customized metrics.</p>

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
