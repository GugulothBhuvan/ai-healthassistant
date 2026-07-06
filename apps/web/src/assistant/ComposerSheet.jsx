// ComposerSheet component: conversational assistant drawer, input composition, and parse overrides

import React, { useState } from "react";
import { TOKENS } from "../tokens.js";
import { useAssistant } from "./useAssistant.js";
import { Voice } from "../components/Voice.jsx";
import { X, Send, Sparkles, Check, AlertTriangle, MessageCircleOff, Loader } from "lucide-react";
import { t } from "../lib/copy.js";

export function ComposerSheet({ isOpen, onClose, onLogCommitted }) {
  const {
    loading,
    transcript,
    parsedResponse,
    errorMsg,
    exchange,
    confirm,
    clear
  } = useAssistant();

  const [inputText, setInputText] = useState("");
  const [sizeOverride, setSizeOverride] = useState(null); // null means use item-specific parsed size

  if (!isOpen) return null;

  const handleSubmitText = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    exchange(inputText.trim(), "");
    setInputText("");
  };

  const handleAudioCaptured = (base64Audio) => {
    exchange("", base64Audio);
  };

  const handleConfirmLog = async () => {
    try {
      const res = await confirm(sizeOverride);
      if (res) {
        // Trigger toast notifications or home state updates
        if (onLogCommitted) {
          onLogCommitted(res);
        }
        onClose();
        clear();
      }
    } catch (err) {
      alert("Failed to confirm log: " + err.message);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInputText(suggestion);
  };

  const suggestions = [
    "do roti aur paneer ki sabji",
    "drank 2 glasses of water",
    "weight today 64.5 kg",
    "khaya chawal and chicken curry"
  ];

  const backdropStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(26, 37, 30, 0.4)",
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
    color: TOKENS.colors.textDark,
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
    color: TOKENS.colors.textDark,
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

  return (
    <div style={backdropStyle} onClick={() => { onClose(); clear(); }}>
      <div style={sheetStyle} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Sparkles size={18} style={{ color: TOKENS.colors.primary }} />
            <h3 style={{ fontSize: "16px", fontWeight: 600, margin: 0 }}>Log Assistant</h3>
          </div>
          <button 
            onClick={() => { onClose(); clear(); }}
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
              <div style={{ fontSize: "13px", color: TOKENS.colors.textMuted }}>Parsing your input...</div>
            </div>
          )}

          {errorMsg && (
            <div style={{ background: "#FFF5F5", border: `1px solid ${TOKENS.colors.border}`, borderRadius: "12px", padding: "16px", color: TOKENS.colors.doctorsTerritory, fontSize: "13px" }}>
              {errorMsg}
            </div>
          )}

          {!loading && !errorMsg && !parsedResponse && (
            <div>
              <p style={{ fontSize: "13px", color: TOKENS.colors.textMuted, margin: "0 0 12px 0" }}>
                Log your meals, weight, or water intake. Say it in Hinglish or English:
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(suggestion)}
                    style={{
                      padding: "8px 12px",
                      background: TOKENS.colors.bg,
                      border: `1px solid ${TOKENS.colors.border}`,
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: TOKENS.colors.textDark,
                      cursor: "pointer",
                      textAlign: "left"
                    }}
                  >
                    "{suggestion}"
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Response Bubble & Confirm Path */}
          {!loading && parsedResponse && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Voice transcript echo */}
              <div style={{ fontSize: "12px", color: TOKENS.colors.textMuted, background: TOKENS.colors.bg, padding: "8px 12px", borderRadius: "8px", fontStyle: "italic" }}>
                Heard: "{parsedResponse.heard}"
              </div>

              {/* Decline Notification */}
              {parsedResponse.decline ? (
                <div style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "flex-start",
                  background: `${TOKENS.colors.textMuted}10`,
                  padding: "16px",
                  borderRadius: "12px"
                }}>
                  <MessageCircleOff size={20} style={{ color: TOKENS.colors.textMuted, flexShrink: 0, marginTop: "2px" }} />
                  <p style={{
                    fontFamily: TOKENS.fonts.assistant,
                    fontSize: "15px",
                    fontStyle: "italic",
                    margin: 0,
                    color: TOKENS.colors.textDark,
                    lineHeight: "1.4"
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
                      <div style={{ fontSize: "11px", color: TOKENS.colors.textMuted, textTransform: "uppercase", marginBottom: "6px" }}>Parsed Foods</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {parsedResponse.food.map((item, idx) => (
                          <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F5F8F6", padding: "10px 14px", borderRadius: "8px" }}>
                            <div>
                              <strong style={{ fontSize: "14px" }}>{item.dish}</strong>
                              <span style={{ fontSize: "11px", color: TOKENS.colors.textMuted, marginLeft: "8px" }}>
                                parsed size: {item.size}
                              </span>
                            </div>
                            <span style={{ fontSize: "12px", fontWeight: 600, color: TOKENS.colors.primary }}>
                              {Math.round(item.confidence * 100)}% Match
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Size modifier chips */}
                      <div style={{ marginTop: "14px" }}>
                        <div style={{ fontSize: "11px", color: TOKENS.colors.textMuted, marginBottom: "6px" }}>Adjust Portion Size (Overrides all)</div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button 
                            type="button"
                            onClick={() => setSizeOverride("small")} 
                            style={chipStyle(sizeOverride === "small")}
                          >
                            Small Katori
                          </button>
                          <button 
                            type="button"
                            onClick={() => setSizeOverride("medium")} 
                            style={chipStyle(sizeOverride === "medium" || (!sizeOverride && parsedResponse.food[0]?.size === "medium"))}
                          >
                            Medium Katori
                          </button>
                          <button 
                            type="button"
                            onClick={() => setSizeOverride("large")} 
                            style={chipStyle(sizeOverride === "large")}
                          >
                            Large Katori
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Water confirmation message */}
                  {parsedResponse.water_glasses && parsedResponse.water_glasses > 0 ? (
                    <div style={{ background: `${TOKENS.colors.water}10`, padding: "12px", borderRadius: "8px", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ color: TOKENS.colors.water, fontWeight: "bold" }}>●</span>
                      <span>Water Intake: <strong>{parsedResponse.water_glasses} glasses</strong></span>
                    </div>
                  ) : null}

                  {/* Weight confirmation message */}
                  {parsedResponse.weight_kg && parsedResponse.weight_kg > 0 ? (
                    <div style={{ background: `${TOKENS.colors.weight}10`, padding: "12px", borderRadius: "8px", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ color: TOKENS.colors.weight, fontWeight: "bold" }}>●</span>
                      <span>Weight Entry: <strong>{parsedResponse.weight_kg} kg</strong></span>
                    </div>
                  ) : null}

                  {/* Unknown dishes warning tray (AC3) */}
                  {parsedResponse.unknown && parsedResponse.unknown.length > 0 && (
                    <div style={{
                      display: "flex",
                      gap: "8px",
                      background: "#FAF6EF",
                      border: `1px solid ${TOKENS.colors.foodFixable}30`,
                      borderRadius: "8px",
                      padding: "12px"
                    }}>
                      <AlertTriangle size={18} style={{ color: TOKENS.colors.foodFixable, flexShrink: 0, marginTop: "2px" }} />
                      <div style={{ fontSize: "12px", color: TOKENS.colors.textDark, lineHeight: "1.4" }}>
                        Unrecognized dishes: <strong>{parsedResponse.unknown.join(", ")}</strong>. We'll log standard estimates, or you can tap to rewrite.
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button 
                    onClick={handleConfirmLog}
                    style={{
                      width: "100%",
                      padding: "14px",
                      background: TOKENS.colors.primary,
                      color: "#ffffff",
                      border: "none",
                      borderRadius: TOKENS.borderRadius.input,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      marginTop: "12px"
                    }}
                  >
                    <Check size={16} /> Confirm Log
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSubmitText} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <input
            type="text"
            style={textInputStyle}
            placeholder="Type: '2 roti paneer sabji' or 'vajan 72kg'"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={loading}
          />
          
          {inputText.trim() ? (
            <button type="submit" style={sendBtnStyle} disabled={loading}>
              <Send size={18} />
            </button>
          ) : (
            <Voice onAudioCaptured={handleAudioCaptured} isBlocked={loading} />
          )}
        </form>
      </div>
    </div>
  );
}
export default ComposerSheet;
