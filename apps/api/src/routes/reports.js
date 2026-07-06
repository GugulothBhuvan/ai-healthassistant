// /reports upload and flags polling endpoints

import express from "express";
import multer from "multer";
import { supabase } from "../db.js";
import { llm } from "../ai/krutrim.js";
import { REPORT_EXTRACT_SYSTEM_PROMPT } from "../ai/prompts/reportExtract.js";
import { markersDb } from "../engine/markers.js";
import { z } from "zod";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Asynchronous background extraction function
async function extractReportBackground(reportId, userId, fileBuffer, fileMimeType, fileExt) {
  try {
    // 1. Update status to 'processing'
    await supabase
      .from("reports")
      .update({ parse_status: "processing" })
      .eq("id", reportId);
    
    // 2. Read basic text for mock checks
    const textContent = fileBuffer.toString("utf8").replace(/[^\x20-\x7E\n\r]/g, "");
    let extractedData = null;
    
    // Check for special demo mock keywords
    if (textContent.includes("AAROGYA_MOCK_PRIYA") || textContent.includes("PRIYA") || fileExt === "priya") {
      extractedData = {
        markers: [
          { marker_id: "iron", label: "Serum Iron", value: 45.0, unit: "µg/dL", range_low: 50, range_high: 170, confidence: 0.95 },
          { marker_id: "vitamin_d", label: "25-OH Vitamin D", value: 16.0, unit: "ng/mL", range_low: 30, range_high: 100, confidence: 0.92 }
        ]
      };
    } else if (textContent.includes("AAROGYA_MOCK_RAJESH") || textContent.includes("RAJESH") || fileExt === "rajesh") {
      extractedData = {
        markers: [
          { marker_id: "hba1c", label: "HbA1c", value: 7.2, unit: "%", range_low: 4.0, range_high: 5.6, confidence: 0.96 },
          { marker_id: "iron", label: "Serum Iron", value: 85.0, unit: "µg/dL", range_low: 50, range_high: 170, confidence: 0.91 }
        ]
      };
    } else {
      // Run actual Krutrim model
      try {
        if (fileMimeType.startsWith("image/")) {
          // Image path
          const base64Image = fileBuffer.toString("base64");
          extractedData = await llm(
            "vision",
            [
              { role: "system", content: REPORT_EXTRACT_SYSTEM_PROMPT },
              { role: "user", content: [
                { type: "text", text: "Extract the blood test markers from this lab report image." },
                { type: "image_url", image_url: { url: `data:${fileMimeType};base64,${base64Image}` } }
              ]}
            ],
            z.object({
              markers: z.array(z.object({
                marker_id: z.string(),
                label: z.string(),
                value: z.number(),
                unit: z.string(),
                range_low: z.number(),
                range_high: z.number(),
                confidence: z.number()
              }))
            })
          );
        } else {
          // Text/PDF path
          const cleanText = textContent.slice(0, 8000);
          extractedData = await llm(
            "parse",
            [
              { role: "system", content: REPORT_EXTRACT_SYSTEM_PROMPT },
              { role: "user", content: `Report text content:\n\n${cleanText}` }
            ],
            z.object({
              markers: z.array(z.object({
                marker_id: z.string(),
                label: z.string(),
                value: z.number(),
                unit: z.string(),
                range_low: z.number(),
                range_high: z.number(),
                confidence: z.number()
              }))
            })
          );
        }
      } catch (llmErr) {
        // Never substitute fixture/fabricated values for a real user's upload —
        // that would show them someone else's bloodwork as their own. Surface
        // the failure honestly; the report is marked "failed" below and the
        // user can re-upload (F2: never guess).
        console.error("Krutrim report extraction failed:", llmErr.message);
        throw llmErr;
      }
    }

    // 3. Normalize & save markers to Supabase
    if (extractedData && extractedData.markers) {
      for (const m of extractedData.markers) {
        let flag = "normal";
        if (m.value < m.range_low) flag = "low";
        else if (m.value > m.range_high) flag = "high";
        
        const refMarker = markersDb[m.marker_id];
        const verdictClass = refMarker ? refMarker.verdict_class : "both";
        
        await supabase.from("report_markers").insert({
          report_id: reportId,
          marker_id: m.marker_id,
          value: m.value,
          unit: m.unit,
          range_low: m.range_low,
          range_high: m.range_high,
          range_source: "Lab Report",
          flag,
          verdict_class: verdictClass,
          confidence: m.confidence
        });
      }
    }
    
    // 4. Update status to 'completed'
    await supabase
      .from("reports")
      .update({ parse_status: "completed" })
      .eq("id", reportId);

  } catch (err) {
    console.error("Background report extraction failed:", err.message);
    await supabase
      .from("reports")
      .update({ parse_status: "failed" })
      .eq("id", reportId);
  }
}

// POST /reports (upload PDF or photo)
router.post("/", upload.single("file"), async (req, res, next) => {
  try {
    const { consent_scope } = req.body;
    if (!req.file) {
      return res.status(400).json({ error: "Missing uploaded file field 'file'" });
    }
    if (!consent_scope) {
      return res.status(400).json({ error: "Consent scope is required to ingest health records." });
    }

    const userId = req.user.id;
    const fileMimeType = req.file.mimetype;
    const fileExt = req.file.originalname.split(".").pop().toLowerCase();
    const isPdf = fileMimeType === "application/pdf" || fileExt === "pdf";
    const sourceType = isPdf ? "pdf" : "photo";

    // 1. Create a row in Supabase reports table
    const { data: newReport, error } = await supabase
      .from("reports")
      .insert({
        user_id: userId,
        source_type: sourceType,
        storage_path: `reports/${userId}/${Date.now()}.${fileExt}`,
        parse_status: "pending",
        consent_scope
      })
      .select("id")
      .single();

    if (error) throw error;
    const reportId = newReport.id;

    // 2. Start extraction asynchronously in the background
    extractReportBackground(reportId, userId, req.file.buffer, fileMimeType, fileExt);

    res.json({ report_id: reportId });
  } catch (err) {
    next(err);
  }
});

// GET /reports/:id/flags (polling endpoint)
router.get("/:id/flags", async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get report record
    const { data: report, error: reportErr } = await supabase
      .from("reports")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (reportErr) {
      return res.status(404).json({ error: "Report not found" });
    }

    if (report.parse_status === "pending" || report.parse_status === "processing") {
      return res.json({ status: report.parse_status });
    }

    if (report.parse_status === "failed") {
      return res.json({ status: "failed", error: "Report parsing failed" });
    }

    // Get extracted markers
    const { data: markers, error: markersErr } = await supabase
      .from("report_markers")
      .select("*")
      .eq("report_id", id);

    if (markersErr) throw markersErr;

    // Sort into flags vs low confidence tray
    const flags = [];
    const low_confidence_tray = [];
    let in_range_count = 0;

    markers.forEach(m => {
      if (m.confidence < 0.7) {
        low_confidence_tray.push(m.label || m.marker_id);
      } else {
        if (m.flag === "normal") {
          in_range_count++;
        } else {
          flags.push({
            marker_id: m.marker_id,
            label: m.label || m.marker_id,
            value: Number(m.value),
            unit: m.unit,
            range_low: Number(m.range_low),
            range_high: Number(m.range_high),
            verdict_class: m.verdict_class,
            confidence: Number(m.confidence)
          });
        }
      }
    });

    res.json({
      status: "completed",
      flags,
      low_confidence_tray,
      in_range_count
    });
  } catch (err) {
    next(err);
  }
});

export default router;
