// Voice component: encapsulates microphone recording and blob capture

import React, { useState, useRef } from "react";
import { Mic, Square, Loader } from "lucide-react";
import { TOKENS } from "../tokens.js";
import { useToast } from "../ui/Feedback.jsx";

/**
 * Microphone component using browser MediaRecorder.
 * Converts recorded webm stream into base64 and invokes `onAudioCaptured`.
 */
export function Voice({ onAudioCaptured, isBlocked = false }) {
  const [status, setStatus] = useState("idle"); // idle, recording, processing
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const toast = useToast();

  const startRecording = async () => {
    if (isBlocked || status === "processing") return;
    
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast("Voice isn't supported here. Please type instead.", { tone: "error" });
        return;
      }

      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Select appropriate MIME type. webm is standard for MediaRecorder.
      let options = { mimeType: "audio/webm" };
      if (!MediaRecorder.isTypeSupported("audio/webm")) {
        // Fallback for Safari / iOS
        options = { mimeType: "audio/mp4" };
      }
      
      const recorder = new MediaRecorder(stream, options);
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const mimeType = recorder.mimeType || "audio/webm";
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        
        // Disable mic usage
        stream.getTracks().forEach((track) => track.stop());

        setStatus("processing");
        const reader = new FileReader();
        reader.onloadend = () => {
          // Extract base64 part
          const base64data = reader.result.split(",")[1];
          onAudioCaptured(base64data);
          setStatus("idle");
        };
        reader.onerror = () => {
          setStatus("idle");
          toast("Couldn't process that recording. Please try again.", { tone: "error" });
        };
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setStatus("recording");
    } catch (err) {
      console.error("Accessing microphone failed:", err);
      setStatus("idle");
      toast("Couldn't access the mic. Check permissions.", { tone: "error" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && status === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  return (
    <button
      onClick={status === "recording" ? stopRecording : startRecording}
      disabled={isBlocked || status === "processing"}
      type="button"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "52px",
        height: "52px",
        borderRadius: "50%",
        border: "none",
        background: status === "recording" ? TOKENS.colors.doctorsTerritory : TOKENS.colors.primary,
        color: "#ffffff",
        cursor: isBlocked || status === "processing" ? "not-allowed" : "pointer",
        boxShadow: TOKENS.shadows.card,
        transition: "all 0.25s ease",
        transform: status === "recording" ? "scale(1.08)" : "scale(1)"
      }}
    >
      {status === "idle" && <Mic size={22} />}
      {status === "recording" && <Square size={18} />}
      {status === "processing" && <Loader style={{ animation: "spin 1s linear infinite" }} size={22} />}
    </button>
  );
}
export default Voice;
