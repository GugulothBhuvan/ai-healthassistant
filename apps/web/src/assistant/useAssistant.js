// assistant state management hook

import { useState } from "react";
import { apiFetch } from "../lib/api.js";

export function useAssistant() {
  const [loading, setLoading] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [parsedResponse, setParsedResponse] = useState(null); // { heard, food, water_glasses, weight_kg, unknown, iron_relevant, decline }
  const [confirmToken, setConfirmToken] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const exchange = async (text = "", audioBase64 = "") => {
    setLoading(true);
    setErrorMsg("");
    setParsedResponse(null);
    
    try {
      const payload = {};
      if (text) payload.text = text;
      if (audioBase64) payload.audio = audioBase64;
      
      const res = await apiFetch("/assistant/exchange", {
        method: "POST",
        body: payload
      });

      setTranscript(res.transcript);
      setParsedResponse(res.parsed);
      setConfirmToken(res.confirm_token);
      return res;
    } catch (err) {
      console.error("Exchange API failed:", err.message);
      setErrorMsg(err.message || "Something went wrong. Please try again.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const confirm = async (sizeOverride = null) => {
    if (!confirmToken) return null;
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await apiFetch("/assistant/confirm", {
        method: "POST",
        body: {
          confirm_token: confirmToken,
          size: sizeOverride
        }
      });
      
      // Clear exchange states after successful commit
      setParsedResponse(null);
      setConfirmToken("");
      setTranscript("");
      return res;
    } catch (err) {
      console.error("Confirmation API failed:", err.message);
      setErrorMsg(err.message || "Failed to commit log.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clear = () => {
    setParsedResponse(null);
    setConfirmToken("");
    setTranscript("");
    setErrorMsg("");
  };

  return {
    loading,
    transcript,
    parsedResponse,
    confirmToken,
    errorMsg,
    exchange,
    confirm,
    clear
  };
}
export default useAssistant;
