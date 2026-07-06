// speech to text and text to speech endpoints

import express from "express";
import multer from "multer";
import { speechToText, textToSpeech } from "../ai/sarvam.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /stt (multipart audio file upload)
router.post("/stt", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file uploaded under field 'file'" });
    }
    
    const transcript = await speechToText(req.file.buffer, req.file.mimetype);
    res.json({ transcript });
  } catch (err) {
    console.error("Sarvam STT Route Error:", err.message);
    next(err);
  }
});

// POST /tts (text to speech base64 conversion)
router.post("/tts", async (req, res, next) => {
  try {
    const { text, languageCode } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Missing text parameter" });
    }
    
    const audioBase64 = await textToSpeech(text, languageCode || "hi-IN");
    res.json({ audio: audioBase64 });
  } catch (err) {
    console.error("Sarvam TTS Route Error:", err.message);
    next(err);
  }
});

export default router;
