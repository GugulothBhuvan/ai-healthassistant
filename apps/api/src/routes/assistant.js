// /exchange, /confirm endpoints

import express from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { supabase } from "../db.js";
import { llm } from "../ai/krutrim.js";
import { INTENT_SYSTEM_PROMPT } from "../ai/prompts/intent.js";
import { FOOD_PARSE_SYSTEM_PROMPT } from "../ai/prompts/foodParse.js";
import { CONVERSATION_SYSTEM_PROMPT } from "../ai/prompts/conversation.js";
import { speechToText } from "../ai/sarvam.js";
import { getDishNutrients, calculateMarkerDeltas, markersDb } from "../engine/markers.js";
import { scaleNutrients } from "../engine/portions.js";
import { 
  ExchangeRequestSchema, 
  ParsedExchangeSchema, 
  ConfirmRequestSchema 
} from "@aarogya/shared";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "aarogya-assistant-secret-key-12345";

// Zod schema for intent response from LLM
const IntentResponseSchema = z.object({
  intent: z.enum(["food", "water", "weight", "workout", "steps", "sleep", "medicine", "report", "other"]),
  confidence: z.number().min(0).max(1),
  explanation: z.string()
});

// POST /assistant/exchange
router.post("/exchange", async (req, res, next) => {
  try {
    const parseReq = ExchangeRequestSchema.safeParse(req.body);
    if (!parseReq.success) {
      return res.status(400).json({ error: "Invalid exchange request", details: parseReq.error.format() });
    }

    const { text, audio } = parseReq.data;
    let queryText = text || "";

    // 1. Transcribe audio if provided
    if (audio) {
      try {
        const audioBuffer = Buffer.from(audio, "base64");
        const transcript = await speechToText(audioBuffer);
        queryText = transcript.trim();
        if (!queryText) {
          return res.status(400).json({ error: "Speech-to-text yielded an empty transcript" });
        }
      } catch (err) {
        console.error("Sarvam STT failed in exchange:", err.message);
        return res.status(502).json({ error: "Voice transcription service is temporarily unavailable. Please try typing." });
      }
    }

    // 2. Classify intent
    let classification;
    try {
      classification = await llm(
        "intent",
        [
          { role: "system", content: INTENT_SYSTEM_PROMPT },
          { role: "user", content: `Query to classify: "${queryText}"` }
        ],
        IntentResponseSchema
      );
    } catch (err) {
      console.error("Krutrim Intent LLM failed:", err.message);
      classification = { intent: "food", confidence: 0.8, explanation: "Fallback to food parse" };
    }

    // 3. Parse content based on intent
    let parsedResult;
    if (["food", "water", "weight", "workout", "steps", "sleep", "medicine"].includes(classification.intent)) {
      try {
        parsedResult = await llm(
          "parse",
          [
            { role: "system", content: FOOD_PARSE_SYSTEM_PROMPT },
            { role: "user", content: `Text to parse: "${queryText}"` }
          ],
          ParsedExchangeSchema
        );
      } catch (err) {
        console.error("Krutrim Parse LLM failed:", err.message);
        // Return friendly error
        return res.status(502).json({ error: "Assistant parsing failed. Try phrasing your meal differently (e.g. 'had 2 roti and dal')." });
      }
    } else {
      // General conversation, report Q&A, or general chat queries
      try {
        parsedResult = await llm(
          "parse",
          [
            { role: "system", content: CONVERSATION_SYSTEM_PROMPT },
            { role: "user", content: `Query: "${queryText}"` }
          ],
          ParsedExchangeSchema
        );
      } catch (err) {
        console.error("Krutrim Conversation LLM failed:", err.message);
        parsedResult = {
          heard: queryText,
          food: [],
          water_glasses: null,
          weight_kg: null,
          unknown: [],
          iron_relevant: false,
          decline: "I am here to help you understand your nutrition and logs. For clinical concerns, please consult a doctor."
        };
      }
    }

    // Ensure we keep the transcript heard
    parsedResult.heard = queryText;

    // 4. Generate confirmation token containing the parsed data.
    // channel is captured here (not at /confirm) since that's the only place
    // we know whether this exchange came from audio or typed text.
    const confirm_token = jwt.sign(
      {
        userId: req.user.id,
        parsed: parsedResult,
        channel: audio ? "voice" : "text"
      },
      JWT_SECRET,
      { expiresIn: "10m" }
    );

    res.json({
      transcript: queryText,
      parsed: parsedResult,
      confirm_token
    });
  } catch (err) {
    next(err);
  }
});

// POST /assistant/confirm
router.post("/confirm", async (req, res, next) => {
  try {
    const parseReq = ConfirmRequestSchema.safeParse(req.body);
    if (!parseReq.success) {
      return res.status(400).json({ error: "Invalid confirm request", details: parseReq.error.format() });
    }

    const { confirm_token, size: overrideSize } = parseReq.data;
    const userId = req.user.id;

    // 1. Decode token
    let decoded;
    try {
      decoded = jwt.verify(confirm_token, JWT_SECRET);
      if (decoded.userId !== userId) {
        return res.status(403).json({ error: "Token belongs to a different session" });
      }
    } catch (err) {
      return res.status(400).json({ error: "Invalid or expired confirmation token" });
    }

    const parsed = decoded.parsed;

    // 2. Resolve nutritional components and scale foods
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalFibre = 0;

    const loggedFoodItems = [];

    parsed.food.forEach(item => {
      const sizeToUse = overrideSize || item.size || "medium";
      const referenceNutrients = getDishNutrients(item.dish);
      
      let scaledNutrients = { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fibre_g: 0, iron_mg: 0, vitamin_d_mcg: 0 };
      let ifctId = null;

      if (referenceNutrients) {
        scaledNutrients = scaleNutrients(referenceNutrients, sizeToUse);
        ifctId = referenceNutrients.ifct_id;
      } else {
        // Safe defaults for unknown dishes (e.g. standard medium Indian dish estimation)
        scaledNutrients = scaleNutrients({
          calories: 150,
          protein_g: 4,
          carbs_g: 20,
          fat_g: 5,
          fibre_g: 1.5,
          iron_mg: 0.5,
          vitamin_d_mcg: 0
        }, sizeToUse);
      }

      loggedFoodItems.push({
        dish: item.dish,
        ifct_id: ifctId,
        size: sizeToUse,
        confidence: item.confidence,
        nutrients: scaledNutrients
      });

      totalCalories += scaledNutrients.calories;
      totalProtein += scaledNutrients.protein_g;
      totalCarbs += scaledNutrients.carbs_g;
      totalFat += scaledNutrients.fat_g;
      totalFibre += scaledNutrients.fibre_g;
    });

    const intake_delta = {
      calories: Math.round(totalCalories),
      protein_g: Math.round(totalProtein * 10) / 10,
      carbs_g: Math.round(totalCarbs * 10) / 10,
      fat_g: Math.round(totalFat * 10) / 10,
      fibre_g: Math.round(totalFibre * 10) / 10
    };

    // 3. Get flagged markers
    const { data: latestReport } = await supabase
      .from("reports")
      .select("id")
      .eq("user_id", userId)
      .eq("parse_status", "completed")
      .order("uploaded_at", { ascending: false })
      .limit(1);

    let flaggedMarkers = [];
    if (latestReport && latestReport.length > 0) {
      const { data: markers } = await supabase
        .from("report_markers")
        .select("*")
        .eq("report_id", latestReport[0].id)
        .neq("flag", "normal");
      flaggedMarkers = markers || [];
    }

    // 4. Fetch past 7 days logs for weekly progress pct
    const pastWeekStart = new Date();
    pastWeekStart.setDate(pastWeekStart.getDate() - 6);
    pastWeekStart.setHours(0, 0, 0, 0);

    const { data: weeklyLogs } = await supabase
      .from("logs")
      .select("*")
      .eq("user_id", userId)
      .gte("ts", pastWeekStart.toISOString());

    // Sum nutrients for the new scaled foods
    const totalNewNutrients = {
      iron_mg: loggedFoodItems.reduce((acc, item) => acc + (item.nutrients.iron_mg || 0), 0),
      vitamin_d_mcg: loggedFoodItems.reduce((acc, item) => acc + (item.nutrients.vitamin_d_mcg || 0), 0),
      fibre_g: totalFibre
    };

    // Calculate marker deltas
    const marker_deltas = calculateMarkerDeltas(totalNewNutrients, flaggedMarkers, weeklyLogs || []);

    // 5. Commit logs to DB
    const logsCreated = [];

    // Save food logs
    if (loggedFoodItems.length > 0) {
      const { data: logRow, error } = await supabase
        .from("logs")
        .insert({
          user_id: userId,
          type: "food",
          raw_text: parsed.heard,
          channel: decoded.channel || "text",
          parse: {
            heard: parsed.heard,
            food: loggedFoodItems
          }
        })
        .select("id");
      if (error) throw error;
      if (logRow && logRow[0]) logsCreated.push(logRow[0].id);
    }

    // Save water logs
    if (parsed.water_glasses && parsed.water_glasses > 0) {
      const { data: logRow, error } = await supabase
        .from("logs")
        .insert({
          user_id: userId,
          type: "water",
          raw_text: parsed.heard,
          channel: decoded.channel || "text",
          parse: {
            water_glasses: parsed.water_glasses
          }
        })
        .select("id");
      if (error) throw error;
      if (logRow && logRow[0]) logsCreated.push(logRow[0].id);
    }

    // Save weight logs
    if (parsed.weight_kg && parsed.weight_kg > 0) {
      const { data: logRow, error } = await supabase
        .from("logs")
        .insert({
          user_id: userId,
          type: "weight",
          raw_text: parsed.heard,
          channel: decoded.channel || "text",
          parse: {
            weight_kg: parsed.weight_kg
          }
        })
        .select("id");
      if (error) throw error;
      if (logRow && logRow[0]) logsCreated.push(logRow[0].id);
    }

    // Save activity/workout logs
    if (parsed.activity) {
      const { data: logRow, error } = await supabase
        .from("logs")
        .insert({
          user_id: userId,
          type: "activity",
          raw_text: parsed.heard,
          channel: decoded.channel || "text",
          parse: parsed.activity
        })
        .select("id");
      if (error) throw error;
      if (logRow && logRow[0]) logsCreated.push(logRow[0].id);
    }

    // Save steps logs
    if (parsed.steps && parsed.steps > 0) {
      const { data: logRow, error } = await supabase
        .from("logs")
        .insert({
          user_id: userId,
          type: "steps",
          raw_text: parsed.heard,
          channel: decoded.channel || "text",
          parse: {
            steps: parsed.steps
          }
        })
        .select("id");
      if (error) throw error;
      if (logRow && logRow[0]) logsCreated.push(logRow[0].id);
    }

    // Save sleep logs
    if (parsed.sleep && parsed.sleep.hours && parsed.sleep.hours > 0) {
      const { data: logRow, error } = await supabase
        .from("logs")
        .insert({
          user_id: userId,
          type: "sleep",
          raw_text: parsed.heard,
          channel: decoded.channel || "text",
          parse: parsed.sleep
        })
        .select("id");
      if (error) throw error;
      if (logRow && logRow[0]) logsCreated.push(logRow[0].id);
    }

    // Save medicine logs
    if (parsed.medicine) {
      const { data: logRow, error } = await supabase
        .from("logs")
        .insert({
          user_id: userId,
          type: "medicine",
          raw_text: parsed.heard,
          channel: decoded.channel || "text",
          parse: parsed.medicine
        })
        .select("id");
      if (error) throw error;
      if (logRow && logRow[0]) logsCreated.push(logRow[0].id);
    }

    // Update profiles weight if logged weight
    if (parsed.weight_kg && parsed.weight_kg > 0) {
      await supabase
        .from("profiles")
        .update({ weight_kg: parsed.weight_kg })
        .eq("id", userId);
    }

    // 6. Formulate response and toast key
    let toast_key = "toast.plainConfirm";
    let toast_slots = {};

    if (parsed.water_glasses && parsed.water_glasses > 0) {
      toast_key = "toast.waterLogged";
      toast_slots = { count: String(parsed.water_glasses) };
    } else if (parsed.weight_kg && parsed.weight_kg > 0) {
      toast_key = "toast.weightLogged";
      toast_slots = { weight: String(parsed.weight_kg) };
    } else if (parsed.steps && parsed.steps > 0) {
      toast_key = "toast.stepsLogged";
      toast_slots = { count: String(parsed.steps) };
    } else if (parsed.sleep && parsed.sleep.hours && parsed.sleep.hours > 0) {
      toast_key = "toast.sleepLogged";
      toast_slots = { hours: String(parsed.sleep.hours) };
    } else if (parsed.activity) {
      toast_key = "toast.workoutLogged";
      toast_slots = { label: parsed.activity.label };
    } else if (parsed.medicine) {
      toast_key = "toast.medicineLogged";
      toast_slots = { name: parsed.medicine.name };
    } else if (loggedFoodItems.length > 0) {
      // Find if we moved a gap
      const positiveDelta = marker_deltas.find(d => d.contributed);
      if (flaggedMarkers.length > 0 && positiveDelta) {
        const markerMeta = markersDb[positiveDelta.marker_id];
        toast_key = "toast.markerLink";
        toast_slots = {
          marker: markerMeta ? markerMeta.name : positiveDelta.marker_id,
          food: loggedFoodItems[0].dish
        };
      }
    }

    res.json({
      logs_created: logsCreated,
      intake_delta,
      marker_deltas,
      toast_key,
      toast_slots
    });
  } catch (err) {
    next(err);
  }
});

export default router;
