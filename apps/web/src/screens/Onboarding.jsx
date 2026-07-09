// Onboarding screen: 6-step guided setup wizard
// Collects demographics, goals, dream weight, tracking checkbox items, dietary habits,
// and recommends targets that the user can directly edit/customize before submitting.

import React, { useState, useEffect } from "react";
import { TOKENS } from "../tokens.js";
import { apiFetch } from "../lib/api.js";
import { t } from "../lib/copy.js";
import { RangeBar } from "../components/RangeBar.jsx";
import { Label } from "../components/Label.jsx";
import { Upload, ArrowRight, Check, TrendingDown, Dumbbell, ShieldAlert, Heart, Monitor, Footprints, Flame, Mic, Lock, Activity } from "lucide-react";

export function Onboarding({ onCompleted }) {
  const [step, setStep] = useState(-1);

  // Step 1: Physical Metrics
  const [name, setName] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState(""); // empty by default

  // Step 2: Goal & Dream Weight
  const [goal, setGoal] = useState(""); // empty by default; weight_loss | muscle_gain | deficiencies | longevity
  const [dreamWeight, setDreamWeight] = useState("");

  // Step 3: Checkboxes — start empty so the user actively chooses
  const [actions, setActions] = useState([]);

  // Step 4: Plate & Habits
  const [diet, setDiet] = useState(""); // empty by default
  const [activity, setActivity] = useState(""); // empty by default

  // Step 5: Customize Targets
  const [customCalories, setCustomCalories] = useState(1800);
  const [customProtein, setCustomProtein] = useState(55);
  const [customFibre, setCustomFibre] = useState(30);

  // Step 6: Lab report upload
  const [computedTargets, setComputedTargets] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isReportUploading, setIsReportUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

  // Load onboarding progress from localStorage on mount
  useEffect(() => {
    const savedStep = localStorage.getItem("aarogya_onboarding_step");
    if (savedStep) {
      const stepNum = Number(savedStep);
      if (stepNum < 6) {
        setStep(stepNum);
      }
    }
    
    const savedName = localStorage.getItem("aarogya_onboarding_name");
    if (savedName) setName(savedName);
    
    const savedHeight = localStorage.getItem("aarogya_onboarding_height");
    if (savedHeight) setHeight(savedHeight);
    
    const savedWeight = localStorage.getItem("aarogya_onboarding_weight");
    if (savedWeight) setWeight(savedWeight);
    
    const savedAge = localStorage.getItem("aarogya_onboarding_age");
    if (savedAge) setAge(savedAge);
    
    const savedSex = localStorage.getItem("aarogya_onboarding_sex");
    if (savedSex) setSex(savedSex);
    
    const savedGoal = localStorage.getItem("aarogya_onboarding_goal");
    if (savedGoal) setGoal(savedGoal);
    
    const savedDreamWeight = localStorage.getItem("aarogya_onboarding_dream_weight");
    if (savedDreamWeight) setDreamWeight(savedDreamWeight);
    
    const savedActions = localStorage.getItem("aarogya_onboarding_actions");
    if (savedActions) {
      try {
        setActions(JSON.parse(savedActions));
      } catch (e) {}
    }
    
    const savedDiet = localStorage.getItem("aarogya_onboarding_diet");
    if (savedDiet) setDiet(savedDiet);
    
    const savedActivity = localStorage.getItem("aarogya_onboarding_activity");
    if (savedActivity) setActivity(savedActivity);
  }, []);

  // Persist onboarding fields to localStorage on change
  useEffect(() => {
    localStorage.setItem("aarogya_onboarding_step", String(step));
  }, [step]);

  useEffect(() => {
    localStorage.setItem("aarogya_onboarding_name", name);
  }, [name]);

  useEffect(() => {
    localStorage.setItem("aarogya_onboarding_height", height);
  }, [height]);

  useEffect(() => {
    localStorage.setItem("aarogya_onboarding_weight", weight);
  }, [weight]);

  useEffect(() => {
    localStorage.setItem("aarogya_onboarding_age", age);
  }, [age]);

  useEffect(() => {
    localStorage.setItem("aarogya_onboarding_sex", sex);
  }, [sex]);

  useEffect(() => {
    localStorage.setItem("aarogya_onboarding_goal", goal);
  }, [goal]);

  useEffect(() => {
    localStorage.setItem("aarogya_onboarding_dream_weight", dreamWeight);
  }, [dreamWeight]);

  useEffect(() => {
    localStorage.setItem("aarogya_onboarding_actions", JSON.stringify(actions));
  }, [actions]);

  useEffect(() => {
    localStorage.setItem("aarogya_onboarding_diet", diet);
  }, [diet]);

  useEffect(() => {
    localStorage.setItem("aarogya_onboarding_activity", activity);
  }, [activity]);

  const clearOnboardingLocalStorage = () => {
    localStorage.removeItem("aarogya_onboarding_step");
    localStorage.removeItem("aarogya_onboarding_name");
    localStorage.removeItem("aarogya_onboarding_height");
    localStorage.removeItem("aarogya_onboarding_weight");
    localStorage.removeItem("aarogya_onboarding_age");
    localStorage.removeItem("aarogya_onboarding_sex");
    localStorage.removeItem("aarogya_onboarding_goal");
    localStorage.removeItem("aarogya_onboarding_dream_weight");
    localStorage.removeItem("aarogya_onboarding_actions");
    localStorage.removeItem("aarogya_onboarding_diet");
    localStorage.removeItem("aarogya_onboarding_activity");
  };

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
    if (!goal) {
      alert("Please select your primary health goal.");
      return;
    }
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
    if (actions.length === 0) {
      alert("Please select at least one activity to track.");
      return;
    }
    setStep(4);
  };

  const handleNextStep4 = () => {
    if (!diet) {
      alert("Please select your dietary pattern.");
      return;
    }
    if (!activity) {
      alert("Please select your activity level.");
      return;
    }
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
      console.error("Onboarding API error:", err);
      const isMock = 
        !import.meta.env.VITE_SUPABASE_URL || 
        import.meta.env.VITE_SUPABASE_URL.includes("mock") ||
        import.meta.env.VITE_SUPABASE_URL.includes("placeholder");

      if (isMock) {
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
      } else {
        alert(`Could not save profile to database: ${err.message}. Please try again.`);
      }
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
        clearOnboardingLocalStorage();
        onCompleted(computedTargets, uploadRes.report_id);
      }, 1000);
    } catch (err) {
      console.error("Report upload failed during onboarding:", err);
      setUploadStatus("Extraction failed. You can upload again later.");
      setTimeout(() => {
        clearOnboardingLocalStorage();
        onCompleted(computedTargets, null);
      }, 1500);
    } finally {
      setIsReportUploading(false);
    }
  };

  const handleSkipReport = () => {
    clearOnboardingLocalStorage();
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
      {/* Pre-Onboarding Step 1: Voice Value Proposition */}
      {step === -1 && (
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }} className="a-rise">
          <div style={{
            width: "56px", height: "56px", borderRadius: "50%",
            background: TOKENS.colors.primaryLight,
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: "16px"
          }}>
            <Mic size={28} style={{ color: TOKENS.colors.primary }} />
          </div>
          <h1 style={{ ...titleStyle, fontSize: "24px", marginBottom: "8px" }}>Aarogya</h1>
          <p style={{ ...subtitleStyle, fontSize: "14px", marginBottom: "28px" }}>
            Your AI-powered health, nutrition, and wellness companion.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%", marginBottom: "28px", textAlign: "left" }}>
            <div style={{
              padding: "16px", border: `1px solid ${TOKENS.colors.border}`,
              borderRadius: "14px", background: TOKENS.colors.surface
            }}>
              <strong style={{ fontSize: "14.5px", display: "flex", alignItems: "center", gap: "6px", color: TOKENS.colors.textDark, marginBottom: "4px" }}>
                <Mic size={15} style={{ color: TOKENS.colors.primary }} /> Speak naturally to log
              </strong>
              <p style={{ fontSize: "12.5px", color: TOKENS.colors.textMuted, margin: 0, lineHeight: 1.45 }}>
                No more tedious search menus. Log meals, water, workouts, sleep, and medicines in simple natural sentences.
              </p>
            </div>

            <div style={{
              padding: "16px", border: `1px solid ${TOKENS.colors.border}`,
              borderRadius: "14px", background: TOKENS.colors.surface
            }}>
              <strong style={{ fontSize: "14.5px", display: "flex", alignItems: "center", gap: "6px", color: TOKENS.colors.textDark, marginBottom: "4px" }}>
                <Activity size={15} style={{ color: TOKENS.colors.primary }} /> Science-backed targets
              </strong>
              <p style={{ fontSize: "12.5px", color: TOKENS.colors.textMuted, margin: 0, lineHeight: 1.45 }}>
                Formulate personalized baseline targets for calories, protein, and fiber calculated with clinical precision.
              </p>
            </div>
          </div>

          <button style={buttonStyle} onClick={() => setStep(0)}>
            Next <ArrowRight size={18} />
          </button>
        </div>
      )}

      {/* Pre-Onboarding Step 2: Biomarker Value Proposition */}
      {step === 0 && (
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }} className="a-rise">
          <div style={{
            width: "56px", height: "56px", borderRadius: "50%",
            background: TOKENS.colors.primaryLight,
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: "16px"
          }}>
            <ShieldAlert size={28} style={{ color: TOKENS.colors.primary }} />
          </div>
          <h1 style={{ ...titleStyle, fontSize: "24px", marginBottom: "8px" }}>Connect the dots</h1>
          <p style={{ ...subtitleStyle, fontSize: "14px", marginBottom: "28px" }}>
            Go beyond calories to identify real biomarker gaps.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%", marginBottom: "28px", textAlign: "left" }}>
            <div style={{
              padding: "16px", border: `1px solid ${TOKENS.colors.border}`,
              borderRadius: "14px", background: TOKENS.colors.surface
            }}>
              <strong style={{ fontSize: "14.5px", display: "flex", alignItems: "center", gap: "6px", color: TOKENS.colors.textDark, marginBottom: "4px" }}>
                <Heart size={15} style={{ color: TOKENS.colors.primary }} /> Optional biomarker matching
              </strong>
              <p style={{ fontSize: "12.5px", color: TOKENS.colors.textMuted, margin: 0, lineHeight: 1.45 }}>
                Upload standard blood panels to instantly flag deficiencies (e.g. Iron, Vitamin D) and map corrective food sources.
              </p>
            </div>

            <div style={{
              padding: "16px", border: `1px solid ${TOKENS.colors.border}`,
              borderRadius: "14px", background: TOKENS.colors.surface
            }}>
              <strong style={{ fontSize: "14.5px", display: "flex", alignItems: "center", gap: "6px", color: TOKENS.colors.textDark, marginBottom: "4px" }}>
                <Lock size={15} style={{ color: TOKENS.colors.primary }} /> Privacy by Design
              </strong>
              <p style={{ fontSize: "12.5px", color: TOKENS.colors.textMuted, margin: 0, lineHeight: 1.45 }}>
                Your clinical data is processed securely with strict DPDP compliance and consent limits.
              </p>
            </div>
          </div>

          <button style={buttonStyle} onClick={() => setStep(1)}>
            Get Started <ArrowRight size={18} />
          </button>
        </div>
      )}

      {/* Step 1: Body demographics */}
      {step === 1 && (
        <div>
          <h1 style={titleStyle}>Tell us about yourself</h1>
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
            Next <ArrowRight size={18} />
          </button>
        </div>
      )}

      {/* Step 5: Customize Targets */}
      {step === 5 && (
        <div>
          <h1 style={titleStyle}>Set Daily Targets</h1>
          <p style={subtitleStyle}>These are calculated based on your Mifflin-St Jeor details, but you must review and input your preferred values.</p>

          {/* Derivation info card (P1-2) */}
          <div style={{
            background: TOKENS.colors.bg,
            borderRadius: TOKENS.borderRadius.input,
            padding: "12px 14px",
            marginBottom: "20px",
            fontSize: "12px",
            color: TOKENS.colors.textMuted,
            lineHeight: 1.6,
            display: "flex",
            alignItems: "flex-start",
            gap: "8px"
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={TOKENS.colors.textFaint} strokeWidth="2" style={{ flexShrink: 0, marginTop: "2px" }}>
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
            <span>
              Based on age {age}, height {height}cm, weight {weight}kg,
              "{activity === "mostly_sitting" ? "Mostly sitting" : activity === "somewhere_between" ? "Somewhere between" : "On my feet a lot"}" activity,
              {diet === "vegetarian" ? " Veg" : diet === "eggs_ok" ? " Eggs ok" : " Non-veg"} diet.
            </span>
          </div>

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

      {/* Step 6: Voice-first close (report optional) */}
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
              <div style={{ fontSize: "18px", fontWeight: "bold", color: TOKENS.colors.primary }}>{computedTargets.calories}</div>
              <div style={{ fontSize: "10px", color: TOKENS.colors.textMuted }}>kcal</div>
            </div>
            <div>
              <div style={{ fontSize: "11px", color: TOKENS.colors.textMuted }}>Protein</div>
              <div style={{ fontSize: "18px", fontWeight: "bold", color: TOKENS.colors.primary }}>{computedTargets.protein_g}</div>
              <div style={{ fontSize: "10px", color: TOKENS.colors.textMuted }}>g</div>
            </div>
            <div>
              <div style={{ fontSize: "11px", color: TOKENS.colors.textMuted }}>Fibre</div>
              <div style={{ fontSize: "18px", fontWeight: "bold", color: TOKENS.colors.primary }}>{computedTargets.fibre_g}</div>
              <div style={{ fontSize: "10px", color: TOKENS.colors.textMuted }}>g</div>
            </div>
          </div>

          {/* Voice-first card — the assistant is the key feature (P3-1) */}
          <div style={{
            background: TOKENS.colors.primary,
            borderRadius: TOKENS.borderRadius.lg || "16px",
            padding: "22px",
            color: "#ffffff",
            textAlign: "center",
            marginBottom: "16px"
          }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "10px" }}>
              <Mic size={26} style={{ color: "#ffffff" }} />
            </div>
            <h2 style={{
              fontFamily: TOKENS.fonts.assistant,
              fontSize: "17px",
              fontWeight: 600,
              margin: "0 0 8px",
              color: "#ffffff",
              lineHeight: 1.4
            }}>
              {t("onboarding.voiceFirstTitle")}
            </h2>
            <p style={{ fontSize: "13px", color: "#C7DACC", margin: "0 0 14px", lineHeight: 1.45 }}>
              {t("onboarding.voiceFirstBody")}
            </p>
            <div style={{
              background: "rgba(255,255,255,0.08)",
              borderRadius: "10px",
              padding: "12px"
            }}>
              <p style={{ fontSize: "12px", color: "#EAF2EC", margin: 0, lineHeight: 1.6 }}>
                Try saying "2 rotis and dal for lunch", "3 glasses of water", or "took my vitamin D" — Aarogya understands and logs it for you.
              </p>
            </div>
          </div>

          {/* Primary CTA — start with the assistant */}
          <button style={buttonStyle} onClick={handleSkipReport}>
            <Mic size={16} />
            {t("onboarding.startCta")}
          </button>

          {/* Optional, secondary: lab report upload as text link */}
          <label style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            padding: "8px 12px",
            background: "transparent",
            color: TOKENS.colors.primary,
            cursor: isReportUploading ? "not-allowed" : "pointer",
            fontSize: "13.5px",
            fontWeight: 600,
            width: "100%",
            boxSizing: "border-box",
            marginTop: "16px",
            textDecoration: "underline"
          }}>
            <Upload size={14} />
            {isReportUploading ? "Reading..." : t("onboarding.reportOptional")}
            <input
              type="file"
              accept="application/pdf,image/*"
              style={{ display: "none" }}
              onChange={handleReportUpload}
              disabled={isReportUploading}
            />
          </label>

          {uploadStatus && (
            <div style={{ fontSize: "12px", color: TOKENS.colors.primary, marginTop: "10px", fontWeight: 500, textAlign: "center" }}>
              {uploadStatus}
            </div>
          )}
        </div>
      )}

      {/* Step progress indicator — bottom of demographics steps (P3-7) */}
      {step >= 1 && (
        <div style={{ marginTop: "28px", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
          <div style={{ display: "flex", gap: "5px" }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <span key={i} style={{
                height: "6px", borderRadius: i <= step ? "3px" : "50%",
                background: i <= step ? TOKENS.colors.primary : TOKENS.colors.border,
                width: i <= step ? "16px" : "6px",
                transition: "all 0.3s ease"
              }} />
            ))}
          </div>
          <div style={{ fontSize: "11px", color: TOKENS.colors.textMuted }}>Step {step} of 6</div>
        </div>
      )}
    </div>
  );
}

export default Onboarding;
