// Profile screen: displays physical metrics, diet details, targets, and reset controls

import React, { useEffect, useState } from "react";
import { TOKENS } from "../tokens.js";
import { apiFetch } from "../lib/api.js";
import { supabase } from "../lib/supabase.js";
import { useToast, useConfirm } from "../ui/Feedback.jsx";
import { Button } from "../ui/primitives.jsx";
import { User, Flame, Compass, RefreshCw, LogOut } from "lucide-react";

export function Profile({ onReset, onReplayTour }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const confirmDialog = useConfirm();

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/home");
      setProfile(res);
    } catch (err) {
      console.error("Failed to load profile details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    const ok = await confirmDialog({
      title: "Log out?",
      body: "You will be logged out of your current session. You can start a fresh journey.",
      confirmLabel: "Log Out",
      cancelLabel: "Cancel",
      tone: "danger"
    });
    if (!ok) return;

    try {
      const isMock = 
        !import.meta.env.VITE_SUPABASE_URL || 
        import.meta.env.VITE_SUPABASE_URL.includes("mock") ||
        import.meta.env.VITE_SUPABASE_URL.includes("placeholder");

      if (!isMock) {
        await supabase.auth.signOut();
      }

      // Clear local storage progress & tokens
      localStorage.removeItem("aarogya_tour_seen");
      localStorage.removeItem("aarogya_onboarding_done");
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

      // Clear cabinet and logs
      localStorage.removeItem("aarogya_cabinet");
      localStorage.removeItem("aarogya_symptoms_log");
      localStorage.removeItem("aarogya_taken_doses");

      if (isMock) {
        localStorage.removeItem("aarogya_mock_user_id");
      }

      onReset();
    } catch (err) {
      console.error("Logout failed:", err);
      toast("Couldn't log out. Please try again.", { tone: "error" });
    }
  };

  const handleResetProfile = async () => {
    const ok = await confirmDialog({
      title: "Reset everything?",
      body: "Your profile, logs, and linked reports will be deleted and the app will start over.",
      confirmLabel: "Reset",
      cancelLabel: "Cancel",
      tone: "danger"
    });
    if (!ok) return;

    try {
      // Call backend API reset endpoint to delete database records safely using JWT/mock authentication
      await apiFetch("/reset", { method: "POST" });

      // Clear local storage progress & tokens
      localStorage.removeItem("aarogya_tour_seen");
      localStorage.removeItem("aarogya_onboarding_done");
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

      // Clear cabinet and logs
      localStorage.removeItem("aarogya_cabinet");
      localStorage.removeItem("aarogya_symptoms_log");
      localStorage.removeItem("aarogya_taken_doses");

      const isMock = 
        !import.meta.env.VITE_SUPABASE_URL || 
        import.meta.env.VITE_SUPABASE_URL.includes("mock") ||
        import.meta.env.VITE_SUPABASE_URL.includes("placeholder");

      // In mock mode, generate a FRESH mock user ID so they get a completely clean session on reset!
      if (isMock) {
        localStorage.removeItem("aarogya_mock_user_id");
      }

      onReset();
    } catch (err) {
      console.error("Resetting profile failed:", err);
      toast("Couldn't reset your profile. Please try again.", { tone: "error" });
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "400px", fontFamily: TOKENS.fonts.data, color: TOKENS.colors.textMuted }}>
        Loading profile details...
      </div>
    );
  }

  const hasProfile = profile && profile.profile_completed;
  const targets = profile ? profile.targets : { calories: 2000, protein_g: 60, fibre_g: 30 };
  const diet = profile ? profile.diet : "vegetarian";

  const cardStyle = {
    background: TOKENS.colors.surface,
    borderRadius: TOKENS.borderRadius.card,
    padding: "20px",
    boxShadow: TOKENS.shadows.card,
    marginBottom: "20px",
    border: `1px solid ${TOKENS.colors.border}`,
    fontFamily: TOKENS.fonts.data
  };

  return (
    <div style={{ color: TOKENS.colors.textDark, paddingBottom: "80px" }}>
      {/* Title */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontFamily: TOKENS.fonts.assistant, fontSize: "24px", fontWeight: "normal", color: TOKENS.colors.primary, margin: 0 }}>
          About You
        </h1>
        <div style={{ fontSize: "14px", color: TOKENS.colors.textMuted }}>
          Manage your physical and dietary settings
        </div>
      </div>

      {hasProfile ? (
        <div>
          {/* Metrics Card */}
          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <User size={18} style={{ color: TOKENS.colors.primary }} />
              <h3 style={{ fontSize: "16px", fontWeight: 600, margin: 0 }}>Physical Demographics</h3>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", fontSize: "14px" }}>
              <div>
                <span style={{ color: "#6B685E", display: "block", fontSize: "11px", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.04em" }}>Name</span>
                <strong>{targets.name || (profile.name && profile.name !== "there" ? profile.name : "—")}</strong>
              </div>
              <div>
                <span style={{ color: "#6B685E", display: "block", fontSize: "11px", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.04em" }}>Diet</span>
                <strong style={{ textTransform: "capitalize" }}>{diet.replace("_", " ")}</strong>
              </div>
              <div>
                <span style={{ color: "#6B685E", display: "block", fontSize: "11px", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.04em" }}>Gender</span>
                <strong style={{ textTransform: "capitalize" }}>{profile.sex || "—"}</strong>
              </div>
              <div>
                <span style={{ color: "#6B685E", display: "block", fontSize: "11px", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.04em" }}>Age</span>
                <strong>{profile.age || "—"} {profile.age ? "Years" : ""}</strong>
              </div>
              <div>
                <span style={{ color: "#6B685E", display: "block", fontSize: "11px", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.04em" }}>Height</span>
                <strong>{profile.height_cm || "—"} {profile.height_cm ? "cm" : ""}</strong>
              </div>
            </div>
          </div>

          {/* Targets Card */}
          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <Flame size={18} style={{ color: TOKENS.colors.primary }} />
              <h3 style={{ fontSize: "16px", fontWeight: 600, margin: 0 }}>Daily Intake Targets</h3>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", textAlign: "center", background: TOKENS.colors.bg, padding: "16px", borderRadius: TOKENS.borderRadius.input }}>
              <div>
                <div style={{ fontSize: "11px", color: TOKENS.colors.textMuted }}>Calories</div>
                <div style={{ fontSize: "16px", fontWeight: "bold", color: TOKENS.colors.primary, marginTop: "4px" }}>{targets.calories}</div>
                <div style={{ fontSize: "10px", color: TOKENS.colors.textMuted }}>kcal</div>
              </div>
              <div>
                <div style={{ fontSize: "11px", color: TOKENS.colors.textMuted }}>Protein</div>
                <div style={{ fontSize: "16px", fontWeight: "bold", color: TOKENS.colors.primary, marginTop: "4px" }}>{targets.protein_g}</div>
                <div style={{ fontSize: "10px", color: TOKENS.colors.textMuted }}>g</div>
              </div>
              <div>
                <div style={{ fontSize: "11px", color: TOKENS.colors.textMuted }}>Fibre</div>
                <div style={{ fontSize: "16px", fontWeight: "bold", color: TOKENS.colors.primary, marginTop: "4px" }}>{targets.fibre_g}</div>
                <div style={{ fontSize: "10px", color: TOKENS.colors.textMuted }}>g</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ ...cardStyle, textAlign: "center", padding: "40px 20px" }}>
          <p style={{ color: TOKENS.colors.textMuted, fontSize: "14px", margin: "0 0 16px 0" }}>
            No profile information recorded yet.
          </p>
        </div>
      )}

      {/* Replay Tour & Reset Controls */}
      <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {onReplayTour && (
          <Button variant="secondary" size="lg" full onClick={onReplayTour}>
            <Compass size={16} /> Replay Guided Tour
          </Button>
        )}
        <Button variant="secondary" size="lg" full onClick={handleLogout}>
          <LogOut size={16} /> Log Out
        </Button>
        <Button variant="danger" size="lg" full onClick={handleResetProfile}>
          <RefreshCw size={16} /> Reset Profile & Settings
        </Button>
      </div>
    </div>
  );
}
export default Profile;
