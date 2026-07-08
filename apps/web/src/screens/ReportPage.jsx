// Report upload, polling, and flags display screen (DPDP consent & delete-on-demand)

import React, { useEffect, useState } from "react";
import { TOKENS } from "../tokens.js";
import { apiFetch } from "../lib/api.js";
import { supabase } from "../lib/supabase.js";
import { RangeBar } from "../components/RangeBar.jsx";
import { Label } from "../components/Label.jsx";
import { t } from "../lib/copy.js";
import { useToast, useConfirm } from "../ui/Feedback.jsx";
import { Upload, ShieldCheck, Trash2, Loader, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { useAppState } from "../lib/useAppState.jsx";

export function ReportPage() {
  const toast = useToast();
  const confirmDialog = useConfirm();
  const appState = useAppState();
  const [activeReportId, setActiveReportId] = useState(null);
  const [reportState, setReportState] = useState(null); // completed, processing, etc.
  const [consentChecked, setConsentChecked] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [expandedMarkers, setExpandedMarkers] = useState({});

  const checkActiveReport = async () => {
    try {
      // Find the user's latest report in Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: reports, error } = await supabase
        .from("reports")
        .select("id, parse_status")
        .eq("user_id", user.id)
        .order("uploaded_at", { ascending: false })
        .limit(1);

      if (error) throw error;

      if (reports && reports.length > 0) {
        setActiveReportId(reports[0].id);
        setReportState({ status: reports[0].parse_status });
        if (reports[0].parse_status === "completed") {
          loadReportFlags(reports[0].id);
        } else if (reports[0].parse_status === "pending" || reports[0].parse_status === "processing") {
          startPolling(reports[0].id);
        }
      }
    } catch (err) {
      console.error("Checking active reports failed:", err.message);
    }
  };

  useEffect(() => {
    checkActiveReport();
  }, []);

  const loadReportFlags = async (id) => {
    try {
      const data = await apiFetch(`/reports/${id}/flags`);
      setReportState(data);
    } catch (err) {
      console.error("Loading report flags failed:", err);
    }
  };

  const startPolling = (id) => {
    setStatusMsg("Reading bloodwork parameters...");
    const interval = setInterval(async () => {
      try {
        const data = await apiFetch(`/reports/${id}/flags`);
        if (data.status === "completed") {
          clearInterval(interval);
          setReportState(data);
          setStatusMsg("");
          if (appState && appState.refetch) {
            appState.refetch();
          }
        } else if (data.status === "failed") {
          clearInterval(interval);
          setReportState({ status: "failed" });
          setStatusMsg("Scan failed. Try uploading a clearer copy.");
        } else {
          setStatusMsg(`Status: ${data.status}...`);
        }
      } catch (err) {
        console.error("Polling report flags failed:", err);
        clearInterval(interval);
      }
    }, 2000);
  };

  const handleFileUpload = async (e, demoName = null) => {
    if (!consentChecked) {
      toast("Please give consent before uploading.", { tone: "error" });
      return;
    }

    setUploading(true);
    setStatusMsg("Sending to secure server...");
    
    const formData = new FormData();
    const consentText = "DPDP Consent: Processing lab records for dietary matching purposes only.";

    if (demoName) {
      // Mock File for demo
      const blob = new Blob([`AAROGYA_MOCK_${demoName.toUpperCase()}`], { type: "text/plain" });
      formData.append("file", blob, `${demoName.toLowerCase()}_report.txt`);
    } else {
      const file = e.target.files[0];
      if (!file) {
        setUploading(false);
        return;
      }
      formData.append("file", file);
    }
    
    formData.append("consent_scope", consentText);

    try {
      const res = await apiFetch("/reports", {
        method: "POST",
        body: formData
      });
      
      setActiveReportId(res.report_id);
      setReportState({ status: "pending" });
      startPolling(res.report_id);
    } catch (err) {
      console.error("Upload failed:", err);
      toast("Upload failed. Please try a clearer copy.", { tone: "error" });
    } finally {
      setUploading(false);
    }
  };

  // DPDP Delete on Demand
  const handleDeleteReport = async () => {
    if (!activeReportId) return;
    const ok = await confirmDialog({
      title: "Remove this report?",
      body: "Your linked report and all its parsed markers will be permanently deleted.",
      confirmLabel: "Delete",
      cancelLabel: "Keep",
      tone: "danger"
    });
    if (!ok) return;

    try {
      // Delete from Supabase client using active RLS
      const { error } = await supabase.from("reports").delete().eq("id", activeReportId);
      if (error) throw error;

      setActiveReportId(null);
      setReportState(null);
      setStatusMsg("");
      toast("Report deleted from our records.", { tone: "success" });
      if (appState && appState.refetch) {
        appState.refetch();
      }
    } catch (err) {
      console.error("Deletion failed:", err);
      toast("Couldn't delete the report. Please try again.", { tone: "error" });
    }
  };

  const toggleExpandMarker = (id) => {
    setExpandedMarkers(prev => ({ ...prev, [id]: !prev[id] }));
  };

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
          My Bloodwork
        </h1>
        <div style={{ fontSize: "14px", color: TOKENS.colors.textMuted }}>
          Personal health scanner (DPDP privacy compliant)
        </div>
      </div>

      {/* Upload Panel if no active report */}
      {!activeReportId ? (
        <div style={cardStyle}>
          <h2 style={{ fontSize: "16px", fontWeight: 600, color: TOKENS.colors.primary, margin: "0 0 12px 0" }}>
            Ingest Lab Report
          </h2>
          <p style={{ fontSize: "13px", color: TOKENS.colors.textMuted, margin: "0 0 20px 0", lineHeight: "1.4" }}>
            Aarogya parses blood panels, highlights nutritional deficiencies, and links them directly to what you eat. Supported formats: PDF, JPEG, PNG.
          </p>

          {/* Consent Checkbox */}
          <div style={{
            display: "flex",
            gap: "10px",
            alignItems: "flex-start",
            background: TOKENS.colors.bg,
            padding: "12px",
            borderRadius: TOKENS.borderRadius.input,
            marginBottom: "20px",
            border: `1px solid ${TOKENS.colors.border}`
          }}>
            <input 
              type="checkbox" 
              id="dpdp-consent" 
              checked={consentChecked} 
              onChange={(e) => setConsentChecked(e.target.checked)}
              style={{ marginTop: "3px", cursor: "pointer" }}
            />
            <label htmlFor="dpdp-consent" style={{ fontSize: "12px", color: TOKENS.colors.textMuted, cursor: "pointer", lineHeight: "1.4" }}>
              <strong>Consent to process (DPDP Act):</strong> I authorize Aarogya to extract blood test values for matching nutrient goals. Data is used exclusively for my dashboard and can be deleted on demand.
            </label>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}>
            <label style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "16px 24px",
              background: consentChecked ? TOKENS.colors.primary : TOKENS.colors.border,
              color: consentChecked ? "#ffffff" : TOKENS.colors.textMuted,
              borderRadius: TOKENS.borderRadius.input,
              cursor: consentChecked && !uploading ? "pointer" : "not-allowed",
              fontSize: "14px",
              fontWeight: 600,
              width: "100%",
              boxSizing: "border-box"
            }}>
              <Upload size={18} />
              {uploading ? "Uploading..." : "Upload PDF / Photo"}
              <input 
                type="file" 
                accept="application/pdf,image/*" 
                style={{ display: "none" }} 
                onChange={handleFileUpload}
                disabled={!consentChecked || uploading}
              />
            </label>

            {/* Quick Demo Upload triggers */}
            <div style={{ width: "100%", marginTop: "16px", borderTop: `1px solid ${TOKENS.colors.border}`, paddingTop: "16px" }}>
              <div style={{ fontSize: "11px", color: TOKENS.colors.textMuted, textAlign: "center", marginBottom: "10px", textTransform: "uppercase" }}>
                Developer Demos (Preloaded Profiles)
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <button
                  onClick={(e) => handleFileUpload(e, "priya")}
                  disabled={!consentChecked || uploading}
                  style={{
                    padding: "10px",
                    background: "#ffffff",
                    color: TOKENS.colors.primary,
                    border: `1px solid ${TOKENS.colors.primary}`,
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: consentChecked && !uploading ? "pointer" : "not-allowed"
                  }}
                >
                  Priya (Low Iron, VitD)
                </button>
                <button
                  onClick={(e) => handleFileUpload(e, "rajesh")}
                  disabled={!consentChecked || uploading}
                  style={{
                    padding: "10px",
                    background: "#ffffff",
                    color: TOKENS.colors.primary,
                    border: `1px solid ${TOKENS.colors.primary}`,
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: consentChecked && !uploading ? "pointer" : "not-allowed"
                  }}
                >
                  Rajesh (High HbA1c)
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Active Report Results */
        <div>
          {/* Polling / Extraction State */}
          {reportState && (reportState.status === "pending" || reportState.status === "processing") && (
            <div style={{ ...cardStyle, textAlign: "center", padding: "40px 20px" }}>
              <Loader style={{ animation: "spin 2s linear infinite", color: TOKENS.colors.primary, margin: "0 auto 16px auto" }} size={32} />
              <div style={{ fontWeight: 600, fontSize: "16px", color: TOKENS.colors.textDark }}>{statusMsg}</div>
              <p style={{ fontSize: "12px", color: TOKENS.colors.textMuted, margin: "8px 0 0 0" }}>
                Running intent parsing and model checks in background.
              </p>
            </div>
          )}

          {/* Failed extraction state */}
          {reportState && reportState.status === "failed" && (
            <div style={{ ...cardStyle, textAlign: "center", padding: "32px" }}>
              <p style={{ color: TOKENS.colors.doctorsTerritory, fontWeight: 600, margin: "0 0 16px 0" }}>
                Report scanning failed.
              </p>
              <button 
                onClick={handleDeleteReport} 
                style={{ padding: "10px 16px", background: TOKENS.colors.primary, color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" }}
              >
                Clear & Re-Upload
              </button>
            </div>
          )}

          {/* Completed State Display */}
          {reportState && reportState.status === "completed" && (
            <div>
              {/* Privacy Shield Banner */}
              <div style={{
                ...cardStyle,
                background: TOKENS.colors.primaryLight,
                borderColor: `${TOKENS.colors.primary}15`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "14px 20px"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: TOKENS.colors.primary, fontWeight: 500 }}>
                  <ShieldCheck size={18} />
                  <span>Report active (DPDP protected)</span>
                </div>
                <button 
                  onClick={handleDeleteReport} 
                  style={{
                    background: "none",
                    border: "none",
                    color: TOKENS.colors.doctorsTerritory,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "12px",
                    fontWeight: 600
                  }}
                >
                  <Trash2 size={14} /> Remove Report
                </button>
              </div>

              {/* Flags Header proportion */}
              <div style={{
                fontSize: "16px",
                fontFamily: TOKENS.fonts.assistant,
                color: TOKENS.colors.primary,
                margin: "8px 0 16px 4px",
                fontStyle: "italic"
              }}>
                {reportState.flags && reportState.flags.length > 0 
                  ? t("flags.headerProportion") 
                  : "All markers parsed are in range."}
              </div>

              {/* Flags list */}
              {reportState.flags && reportState.flags.map((flag) => {
                const isExpanded = !!expandedMarkers[flag.marker_id];
                
                // Get standard diet guidance based on user profile if available, or static fallback
                const markerMeta = flag.marker_id === "iron" 
                  ? { diet_guidance: { vegetarian: "Palak Paneer, Sambar, and Dal Tadka are good vegetarian sources of iron.", non_veg: "Include Egg Curry, Chicken Curry, or spinach dishes for iron." } }
                  : flag.marker_id === "vitamin_d"
                  ? { diet_guidance: { vegetarian: "Include Curd and dairy products. Sun exposure is helpful.", non_veg: "Egg yolks, dairy products (Curd), and fish contribute Vitamin D." } }
                  : flag.marker_id === "hba1c"
                  ? { diet_guidance: { vegetarian: "Reduce refined carbohydrates. Eat more fiber (Dal Tadka, Sambar, whole wheat).", non_veg: "Avoid simple starches like white rice. Opt for whole grains, lean proteins, and fiber." } }
                  : null;

                const guidance = markerMeta ? markerMeta.diet_guidance.vegetarian : "Focus on incorporating fiber and nutrients into daily meals.";

                return (
                  <div key={flag.marker_id} style={cardStyle}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <div style={{ fontWeight: 600, fontSize: "15px" }}>{flag.label}</div>
                      <Label text={flag.verdict_class.replace("_", " ")} type={flag.verdict_class} />
                    </div>

                    <RangeBar 
                      value={flag.value} 
                      rangeLow={flag.range_low} 
                      rangeHigh={flag.range_high} 
                      unit={flag.unit} 
                    />

                    {/* Diet guidance expander */}
                    <div style={{ marginTop: "12px", borderTop: `1px solid ${TOKENS.colors.border}`, paddingTop: "10px" }}>
                      <button
                        onClick={() => toggleExpandMarker(flag.marker_id)}
                        style={{
                          background: "none",
                          border: "none",
                          width: "100%",
                          textAlign: "left",
                          cursor: "pointer",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontSize: "12px",
                          color: TOKENS.colors.primary,
                          fontWeight: 600,
                          padding: "4px 0"
                        }}
                      >
                        <span>Diet-Aware Food Guidance</span>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>

                      {isExpanded && (
                        <div style={{ 
                          marginTop: "8px", 
                          fontSize: "12px", 
                          color: TOKENS.colors.textMuted, 
                          lineHeight: "1.4",
                          background: TOKENS.colors.bg,
                          padding: "10px",
                          borderRadius: "8px"
                        }}>
                          {guidance}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Low confidence tray */}
              {reportState.low_confidence_tray && reportState.low_confidence_tray.length > 0 && (
                <div style={{
                  ...cardStyle,
                  background: "#FAF4F4",
                  borderColor: `${TOKENS.colors.doctorsTerritory}15`
                }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: TOKENS.colors.doctorsTerritory, display: "flex", gap: "6px", alignItems: "center", marginBottom: "6px" }}>
                    <span>{t("flags.lowConfidenceTray")}</span>
                  </div>
                  <p style={{ fontSize: "11px", color: TOKENS.colors.textMuted, margin: "0 0 10px 0" }}>
                    These markers were found in the file, but value or ranges could not be extracted with high confidence. Excluded from flags to prevent clinical overclaim.
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {reportState.low_confidence_tray.map((label, idx) => (
                      <span key={idx} style={{
                        padding: "3px 8px",
                        background: "#ffffff",
                        border: `1px solid ${TOKENS.colors.border}`,
                        borderRadius: TOKENS.borderRadius.badge,
                        fontSize: "11px",
                        color: TOKENS.colors.textMuted
                      }}>
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* In range count summary */}
              {reportState.in_range_count > 0 && (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "13px",
                  color: TOKENS.colors.textMuted,
                  margin: "8px 0 16px 4px"
                }}>
                  <CheckCircle2 size={16} style={{ color: TOKENS.colors.primary }} />
                  <span>{reportState.in_range_count} markers are within normal range.</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
export default ReportPage;
