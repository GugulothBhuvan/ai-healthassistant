// Sarvam STT/TTS wrappers

import dotenv from "dotenv";
dotenv.config();

/**
 * Transcribe audio buffer using Sarvam Saaras v3
 * @param {Buffer} audioBuffer
 * @param {string} mimeType
 * @returns {Promise<string>}
 */
export async function speechToText(audioBuffer, mimeType = "audio/webm") {
  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) {
    throw new Error("Missing SARVAM_API_KEY environment variable");
  }

  const formData = new FormData();
  // Construct Blob from audioBuffer
  const fileBlob = new Blob([audioBuffer], { type: mimeType });
  formData.append("file", fileBlob, "speech.webm");
  formData.append("model", "saaras:v3");
  formData.append("language-code", "unknown");
  formData.append("mode", "codemix");

  const res = await fetch("https://api.sarvam.ai/speech-to-text", {
    method: "POST",
    headers: {
      "api-subscription-key": apiKey
    },
    body: formData
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Sarvam STT failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return data.transcript || "";
}

/**
 * Convert text to speech using Sarvam Bulbul v3
 * @param {string} text
 * @param {string} languageCode
 * @returns {Promise<string>} base64 audio string
 */
export async function textToSpeech(text, languageCode = "hi-IN") {
  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) {
    throw new Error("Missing SARVAM_API_KEY environment variable");
  }

  const res = await fetch("https://api.sarvam.ai/text-to-speech", {
    method: "POST",
    headers: {
      "api-subscription-key": apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      text,
      model: "bulbul:v3",
      speaker: "meera",
      target_language_code: languageCode,
      pace: 1.0
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Sarvam TTS failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  // Bulbul v3 REST API returns a JSON containing base64 audio in `audios` array or `audio` field
  return data.audio || (data.audios && data.audios[0]) || "";
}
