// Profile screen: displays physical metrics, diet details, targets, and reset controls

import React, { useEffect, useState } from "react";
import { TOKENS } from "../tokens.js";
import { apiFetch } from "../lib/api.js";
import { supabase } from "../lib/supabase.js";
import { useToast, useConfirm } from "../ui/Feedback.jsx";
import { Button } from "../ui/primitives.jsx";
import { User, Flame, Compass, RefreshCw } from "lucide-react";

export function Profile({ onReset }) {
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
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Clear database records via RLS — matches the confirmation copy above
        // (profile, logs, and linked reports; report_markers cascade with reports).
        await supabase.from("logs").delete().eq("user_id", user.id);
        await supabase.from("reports").delete().eq("user_id", user.id);
        await supabase.from("profiles").delete().eq("id", user.id);

        // Trigger reset callback to go back to onboarding
        onReset();
      }
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
                <span style={{ color: TOKENS.colors.textMuted, display: "block", fontSize: "11px", textTransform: "uppercase" }}>Diet</span>
                <strong style={{ textTransform: "capitalize" }}>{diet.replace("_", " ")}</strong>
              </div>
              <div>
                <span style={{ color: TOKENS.colors.textMuted, display: "block", fontSize: "11px", textTransform: "uppercase" }}>Gender</span>
                <strong style={{ textTransform: "capitalize" }}>{profile.sex || "female"}</strong>
              </div>
              <div>
                <span style={{ color: TOKENS.colors.textMuted, display: "block", fontSize: "11px", textTransform: "uppercase" }}>Age</span>
                <strong>{profile.age || "30"} Years</strong>
              </div>
              <div>
                <span style={{ color: TOKENS.colors.textMuted, display: "block", fontSize: "11px", textTransform: "uppercase" }}>Height</span>
                <strong>{profile.height_cm || "170"} cm</strong>
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

      {/* Reset System Button */}
      <div style={{ marginTop: "24px" }}>
        <Button variant="danger" size="lg" full onClick={handleResetProfile}>
          <RefreshCw size={16} /> Reset Profile & Settings
        </Button>
      </div>
    </div>
  );
}
export default Profile;
