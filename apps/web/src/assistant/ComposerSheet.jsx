import React, { useState, useRef, useEffect } from "react";
import { TOKENS } from "../tokens.js";
import { useAssistant } from "./useAssistant.js";
import { Voice } from "../components/Voice.jsx";
import { X, Send, Check, AlertTriangle, MessageCircleOff, Loader, Camera, Mic, Image as ImageIcon, Sparkles, UtensilsCrossed, Dumbbell, Scale, Droplet, Footprints, Moon, Pill } from "lucide-react";
import { t } from "../lib/copy.js";
import { useToast } from "../ui/Feedback.jsx";
import { useAppState } from "../lib/useAppState.jsx";

const CATEGORIES = [
  { id: "food", name: "Food", icon: UtensilsCrossed, placeholder: "Type: '2 roti paneer sabji' or...", suggestions: ["do roti aur paneer ki sabji", "had oats and apple for breakfast", "black coffee with sugar"] },
  { id: "workout", name: "Workout", icon: Dumbbell, placeholder: "Type: '45 mins strength training' or...", suggestions: ["45 mins strength training", "ran 5k in 25 mins", "did yoga for 20 mins"] },
  { id: "weight", name: "Weight", icon: Scale, placeholder: "Type: 'weighed 71.5 kg' or...", suggestions: ["weighed 71.5 kg today", "weight 68 kg"] },
  { id: "water", name: "Water", icon: Droplet, placeholder: "Type: 'drank 2 glasses of water' or...", suggestions: ["drank 2 glasses of water", "logged 3 cups of water"] },
  { id: "steps", name: "Steps", icon: Footprints, placeholder: "Type: 'walked 8000 steps today' or...", suggestions: ["walked 8000 steps today", "completed 10k steps"] },
  { id: "sleep", name: "Sleep", icon: Moon, placeholder: "Type: 'slept for 7.5 hours' or...", suggestions: ["slept for 7.5 hours last night", "logged 8h sleep"] },
  { id: "medicine", name: "Medicine", icon: Pill, placeholder: "Type: 'took my vitamin D' or...", suggestions: ["took my vitamin D", "took my medicine"] }
];

export function ComposerSheet({ isOpen, onClose, onLogCommitted, initialMode = "text", initialPlaceholder = "" }) {
  const [selectedCategory, setSelectedCategory] = useState("food");
  const [placeholderOverride, setPlaceholderOverride] = useState("");
  const {
    loading,
    transcript,
    parsedResponse,
    errorMsg,
    exchange,
    confirm,
    clear
  } = useAssistant();
  const toast = useToast();

  const [inputText, setInputText] = useState("");
  const [sizeOverride, setSizeOverride] = useState(null);
  const [mode, setMode] = useState("text"); // text | camera
  const [capturedImage, setCapturedImage] = useState(null); // { dataUrl, thumbnail }
  const fileInputRef = useRef(null);
  const textInputRef = useRef(null);

  // Sync initialMode when sheet opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      if (initialPlaceholder) setInputText("");
    }
  }, [isOpen, initialMode, initialPlaceholder]);

  // Focus text input when opening in text mode
  useEffect(() => {
    if (isOpen && mode === "text" && textInputRef.current && !loading && !parsedResponse) {
      setTimeout(() => textInputRef.current?.focus(), 100);
    }
  }, [isOpen, mode, loading, parsedResponse]);

  if (!isOpen) return null;

  const handleClose = () => {
    onClose();
    clear();
    setMode("text");
    setCapturedImage(null);
    setInputText("");
    setSizeOverride(null);
  };

  const handleSubmitText = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    exchange(inputText.trim(), "");
    setInputText("");
  };

  const handleAudioCaptured = (base64Audio) => {
    exchange("", base64Audio);
  };

  const handleImageSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result;
      setCapturedImage({ dataUrl, name: file.name });

      // Send to assistant as image-based exchange
      // Extract base64 portion for API
      const base64 = dataUrl.split(",")[1];
      exchange("", "", base64);
    };
    reader.readAsDataURL(file);
  };

  const appState = useAppState();

  const handleConfirmLog = async () => {
    try {
      const res = await confirm(sizeOverride);
      if (res) {
        // Refetch home/week data so dashboard updates instantly (P0-2)
        try { await appState.refetch(); } catch (_) {}
        if (onLogCommitted) {
          onLogCommitted(res);
        }
        toast("Logged successfully.", { tone: "success" });
        handleClose();
      }
    } catch (err) {
      toast("Couldn't save that log. Please try again.", { tone: "error" });
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInputText(suggestion);
  };

  const backdropStyle = {
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(26, 33, 38, 0.4)",
    backdropFilter: "blur(4px)",
    zIndex: 1000,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center"
  };

  const sheetStyle = {
    width: "100%",
    maxWidth: "520px",
    background: TOKENS.colors.surface,
    borderTopLeftRadius: "24px",
    borderTopRightRadius: "24px",
    padding: "24px",
    boxShadow: "0 -8px 32px rgba(0, 0, 0, 0.15)",
    boxSizing: "border-box",
    fontFamily: TOKENS.fonts.data,
    color: TOKENS.colors.ink,
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    animation: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
  };

  const textInputStyle = {
    flex: 1,
    padding: "14px 16px",
    fontSize: "15px",
    border: `1px solid ${TOKENS.colors.border}`,
    borderRadius: TOKENS.borderRadius.input,
    background: TOKENS.colors.bg,
    color: TOKENS.colors.ink,
    outline: "none"
  };

  const sendBtnStyle = {
    padding: "12px",
    background: TOKENS.colors.primary,
    color: "#ffffff",
    border: "none",
    borderRadius: "50%",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "48px",
    height: "48px"
  };

  const chipStyle = (isSelected) => ({
    padding: "6px 12px",
    borderRadius: TOKENS.borderRadius.badge,
    fontSize: "12px",
    fontWeight: 500,
    border: `1px solid ${isSelected ? TOKENS.colors.primary : TOKENS.colors.border}`,
    background: isSelected ? TOKENS.colors.primaryLight : "transparent",
    color: isSelected ? TOKENS.colors.primary : TOKENS.colors.textMuted,
    cursor: "pointer"
  });

  // Determine if response is from camera/image
  const isSawResponse = capturedImage && parsedResponse;

  return (
    <div style={backdropStyle} onClick={handleClose}>
      <div style={sheetStyle} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {mode === "camera"
              ? <Camera size={18} style={{ color: TOKENS.colors.primary }} />
              : <Mic size={18} style={{ color: TOKENS.colors.primary }} />
            }
            <h3 style={{ fontSize: "16px", fontWeight: 600, margin: 0 }}>
              {mode === "camera" ? "Snap & Log" : "Talk to Aarogya"}
            </h3>
          </div>
          <button
            onClick={handleClose}
            style={{ background: "none", border: "none", color: TOKENS.colors.textMuted, cursor: "pointer" }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Dynamic Display Area */}
        <div style={{ minHeight: "100px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          {loading && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <Loader style={{ animation: "spin 1.5s linear infinite", color: TOKENS.colors.primary, margin: "0 auto 12px auto" }} size={24} />
              <div style={{ fontSize: "13px", color: TOKENS.colors.textMuted }}>
                {capturedImage ? "Reading that…" : "Parsing your input..."}
              </div>
            </div>
          )}

          {errorMsg && (
            <div style={{ background: TOKENS.v3.redSoft, border: `1px solid ${TOKENS.colors.border}`, borderRadius: "12px", padding: "16px", color: TOKENS.v3.red, fontSize: "13px" }}>
              {errorMsg}
            </div>
          )}

          {/* Camera mode — file picker */}
          {!loading && !errorMsg && !parsedResponse && mode === "camera" && (
            <div style={{ textAlign: "center" }}>
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${TOKENS.colors.border}`,
                  borderRadius: TOKENS.borderRadius.card,
                  padding: "32px 20px",
                  cursor: "pointer",
                  background: TOKENS.colors.bg,
                  transition: "border-color 0.2s ease"
                }}
              >
                <Camera size={32} style={{ color: TOKENS.colors.textMuted, marginBottom: "8px" }} />
                <p style={{ fontSize: "14px", color: TOKENS.colors.textMuted, margin: 0 }}>
                  Snap or choose a photo
                </p>
                <p style={{ fontSize: "11px", color: TOKENS.colors.textFaint, margin: "4px 0 0" }}>
                  Food, prescription, or medicine strip
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: "none" }}
                onChange={handleImageSelected}
              />
            </div>
          )}

          {/* Text mode — suggestions */}
          {!loading && !errorMsg && !parsedResponse && mode === "text" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <p style={{ fontSize: "11px", fontWeight: 600, color: TOKENS.colors.textFaint, textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 8px" }}>
                  Choose Category to Log
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                  {CATEGORIES.map(cat => {
                    const Icon = cat.icon;
                    const isSelected = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(cat.id);
                          setPlaceholderOverride(cat.placeholder);
                        }}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          padding: "10px 6px",
                          borderRadius: "12px",
                          border: `1.5px solid ${isSelected ? TOKENS.colors.primary : TOKENS.colors.border}`,
                          background: isSelected ? TOKENS.colors.primaryLight : "#ffffff",
                          color: isSelected ? TOKENS.colors.primary : TOKENS.colors.ink,
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          boxSizing: "border-box"
                        }}
                      >
                        <Icon size={16} style={{ color: isSelected ? TOKENS.colors.primary : TOKENS.colors.textMuted }} />
                        <span>{cat.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p style={{ fontSize: "11px", fontWeight: 600, color: TOKENS.colors.textFaint, textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 8px" }}>
                  Try saying
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {(CATEGORIES.find(c => c.id === selectedCategory)?.suggestions || []).map((suggestion, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSuggestionClick(suggestion)}
                      style={{
                        padding: "8px 12px",
                        background: TOKENS.colors.bg,
                        border: `1px solid ${TOKENS.colors.border}`,
                        borderRadius: "20px",
                        fontSize: "12px",
                        color: TOKENS.colors.ink,
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.15s ease"
                      }}
                    >
                      "{suggestion}"
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Response Bubble & Confirm Path */}
          {!loading && parsedResponse && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Transcript echo — SAW for camera, HEARD for voice/text */}
              <div style={{
                fontSize: "12px", color: TOKENS.colors.textMuted,
                background: TOKENS.colors.bg, padding: "8px 12px",
                borderRadius: "8px", fontStyle: "italic",
                display: "flex", alignItems: "center", gap: "8px"
              }}>
                {isSawResponse && capturedImage?.dataUrl && (
                  <img
                    src={capturedImage.dataUrl}
                    alt="captured"
                    style={{ width: "44px", height: "44px", borderRadius: "8px", objectFit: "cover", flexShrink: 0 }}
                  />
                )}
                <span>{isSawResponse ? "Saw" : "Heard"}: "{parsedResponse.heard}"</span>
              </div>

              {/* Assistant Conversational/Decline Response */}
              {parsedResponse.decline ? (
                <div style={{
                  display: "flex", gap: "10px", alignItems: "flex-start",
                  background: TOKENS.colors.primaryLight,
                  padding: "16px", borderRadius: "12px",
                  border: `1px solid rgba(23, 89, 74, 0.08)`
                }}>
                  <Sparkles size={18} style={{ color: TOKENS.colors.primary, flexShrink: 0, marginTop: "2px" }} />
                  <p style={{
                    fontFamily: TOKENS.fonts.assistant,
                    fontSize: "14.5px", fontStyle: "italic",
                    margin: 0, color: TOKENS.colors.ink, lineHeight: "1.5"
                  }}>
                    {parsedResponse.decline}
                  </p>
                </div>
              ) : (
                /* Successful Logging confirmation container */
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {/* Food log confirmation list */}
                  {parsedResponse.food && parsedResponse.food.length > 0 && (
                    <div>
                      <div style={{ fontSize: "11px", fontWeight: 600, color: TOKENS.colors.textFaint, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "8px" }}>Got it — confirm before logging</div>
                      <div style={{ background: TOKENS.colors.bg, borderRadius: "10px", padding: "4px 0", border: `1px solid ${TOKENS.colors.border}` }}>
                        {parsedResponse.food.map((item, idx) => (
                          <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 14px", borderBottom: idx < parsedResponse.food.length - 1 ? `1px solid ${TOKENS.colors.border}` : "none" }}>
                            <span style={{ fontSize: "13px" }}>{item.dish}</span>
                            <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px", color: TOKENS.colors.textMuted }}>
                              {item.size}
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={TOKENS.colors.textMuted} strokeWidth="2"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/></svg>
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Size modifier chips */}
                      <div style={{ marginTop: "14px" }}>
                        <div style={{ fontSize: "11px", color: TOKENS.colors.textMuted, marginBottom: "6px" }}>Adjust Portion Size (Overrides all)</div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button type="button" onClick={() => setSizeOverride("small")} style={chipStyle(sizeOverride === "small")}>Small Katori</button>
                          <button type="button" onClick={() => setSizeOverride("medium")} style={chipStyle(sizeOverride === "medium" || (!sizeOverride && parsedResponse.food[0]?.size === "medium"))}>Medium Katori</button>
                          <button type="button" onClick={() => setSizeOverride("large")} style={chipStyle(sizeOverride === "large")}>Large Katori</button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Medicine confirmation */}
                  {parsedResponse.medicine && (
                    <div style={{
                      background: TOKENS.colors.greenSoft,
                      padding: "12px 14px",
                      borderRadius: "8px",
                      fontSize: "14px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
                    }}>
                      <span style={{ color: TOKENS.colors.green, fontWeight: "bold" }}>💊</span>
                      <div>
                        <div style={{ fontWeight: 500 }}>
                          {parsedResponse.medicine.name}
                          {parsedResponse.medicine.dose_text ? ` · ${parsedResponse.medicine.dose_text}` : ""}
                        </div>
                        <div style={{ fontSize: "11px", color: TOKENS.colors.textFaint, marginTop: "2px" }}>
                          {parsedResponse.medicine.source === "prescription"
                            ? t("home.fromPrescription")
                            : t("home.youAddedThis")
                          }
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Activity confirmation */}
                  {parsedResponse.activity && (
                    <div style={{
                      background: TOKENS.colors.greenSoft,
                      padding: "12px 14px",
                      borderRadius: "8px",
                      fontSize: "14px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
                    }}>
                      <span style={{ color: TOKENS.colors.green, fontWeight: "bold" }}>🚶</span>
                      <span>Activity: <strong>{parsedResponse.activity.label}</strong> · ~{parsedResponse.activity.kcal_est} kcal</span>
                    </div>
                  )}

                  {/* Water confirmation */}
                  {parsedResponse.water_glasses && parsedResponse.water_glasses > 0 ? (
                    <div style={{ background: TOKENS.colors.amberSoft, padding: "12px", borderRadius: "8px", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ color: TOKENS.colors.amber, fontWeight: "bold" }}>●</span>
                      <span>Water Intake: <strong>{parsedResponse.water_glasses} glasses</strong></span>
                    </div>
                  ) : null}

                  {/* Weight confirmation */}
                  {parsedResponse.weight_kg && parsedResponse.weight_kg > 0 ? (
                    <div style={{ background: `${TOKENS.colors.weight}10`, padding: "12px", borderRadius: "8px", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ color: TOKENS.colors.weight, fontWeight: "bold" }}>●</span>
                      <span>Weight Entry: <strong>{parsedResponse.weight_kg} kg</strong></span>
                    </div>
                  ) : null}

                  {/* Steps confirmation */}
                  {parsedResponse.steps && parsedResponse.steps > 0 ? (
                    <div style={{ background: TOKENS.colors.greenSoft, padding: "12px", borderRadius: "8px", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ color: TOKENS.colors.green, fontWeight: "bold" }}>🚶‍♂️</span>
                      <span>Steps: <strong>{parsedResponse.steps.toLocaleString()} steps</strong></span>
                    </div>
                  ) : null}

                  {/* Sleep confirmation */}
                  {parsedResponse.sleep && parsedResponse.sleep.hours && parsedResponse.sleep.hours > 0 ? (
                    <div style={{ background: TOKENS.colors.bg, border: `1px solid ${TOKENS.colors.border}`, padding: "12px", borderRadius: "8px", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ color: TOKENS.colors.primary, fontWeight: "bold" }}>🌙</span>
                      <span>Sleep: <strong>{parsedResponse.sleep.hours} hours</strong></span>
                    </div>
                  ) : null}

                  {/* Unknown dishes warning tray */}
                  {parsedResponse.unknown && parsedResponse.unknown.length > 0 && (
                    <div style={{
                      display: "flex", gap: "8px",
                      background: TOKENS.v3.amberSoft,
                      border: `1px solid ${TOKENS.colors.amber}30`,
                      borderRadius: "8px", padding: "12px"
                    }}>
                      <AlertTriangle size={18} style={{ color: TOKENS.colors.amber, flexShrink: 0, marginTop: "2px" }} />
                      <div style={{ fontSize: "12px", color: TOKENS.colors.ink, lineHeight: "1.4" }}>
                        Unrecognized dishes: <strong>{parsedResponse.unknown.join(", ")}</strong>. We'll log standard estimates.
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    onClick={handleConfirmLog}
                    style={{
                      width: "100%", padding: "14px",
                      background: TOKENS.colors.primary,
                      color: "#ffffff", border: "none",
                      borderRadius: TOKENS.borderRadius.input,
                      fontWeight: 600, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      gap: "6px", marginTop: "12px"
                    }}
                  >
                    <Check size={16} /> {isSawResponse ? "Confirm & Add" : "Confirm and log"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSubmitText} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {/* Camera icon inside input bar */}
          <button
            type="button"
            onClick={() => {
              if (mode === "camera") {
                setMode("text");
              } else {
                setMode("camera");
                setCapturedImage(null);
                clear();
              }
            }}
            style={{
              width: "44px", height: "44px", borderRadius: "50%",
              background: "#FFFFFF",
              border: `1px solid ${TOKENS.colors.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", flexShrink: 0, padding: 0
            }}
          >
            <Camera size={17} style={{ color: TOKENS.colors.green }} />
          </button>

          <input
            ref={textInputRef}
            type="text"
            style={textInputStyle}
            placeholder={placeholderOverride || initialPlaceholder || "Type: '2 roti paneer sabji' or..."}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={loading || mode === "camera"}
          />

          {inputText.trim() ? (
            <button type="submit" style={sendBtnStyle} disabled={loading}>
              <Send size={18} />
            </button>
          ) : (
            <Voice onAudioCaptured={handleAudioCaptured} isBlocked={loading || mode === "camera"} />
          )}
        </form>
      </div>
    </div>
  );
}
export default ComposerSheet;
