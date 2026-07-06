// /home, /week, /onboarding endpoints

import express from "express";
import { supabase } from "../db.js";
import { OnboardingProfileSchema } from "@aarogya/shared";
import { calculateTargets } from "../engine/targets.js";

const router = express.Router();

// POST /onboarding
router.post("/onboarding", async (req, res, next) => {
  try {
    const parseResult = OnboardingProfileSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: "Invalid profile data", details: parseResult.error.format() });
    }
    
    const profile = parseResult.data;
    const targets = calculateTargets(profile);
    
    // Save to Supabase profiles table
    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: req.user.id,
        height_cm: profile.height_cm,
        weight_kg: profile.weight_kg,
        age: profile.age,
        sex: profile.sex,
        diet: profile.diet,
        activity: profile.activity,
        targets: targets,
        created_at: new Date().toISOString()
      });
      
    if (error) {
      throw error;
    }
    
    res.json({ targets });
  } catch (err) {
    next(err);
  }
});

// GET /home
router.get("/home", async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // 1. Get profile targets
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
      
    if (profileErr) {
      throw profileErr;
    }
    
    const targets = profile ? profile.targets : { calories: 2000, protein_g: 60, fibre_g: 30 };
    const diet = profile ? profile.diet : "vegetarian";
    
    // 2. Get today's logs (local day bounds)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const { data: logs, error: logsErr } = await supabase
      .from("logs")
      .select("*")
      .eq("user_id", userId)
      .gte("ts", todayStart.toISOString())
      .order("ts", { ascending: true });
      
    if (logsErr) throw logsErr;
    
    // 3. Compute today's intake
    let intake_today = { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fibre_g: 0, water_glasses: 0 };
    const logs_today = [];
    // Most recent weight log today (if any) wins over the stored profile weight.
    let latestWeightKg = profile ? profile.weight_kg : null;

    logs.forEach(log => {
      logs_today.push({
        id: log.id,
        ts: log.ts,
        type: log.type,
        raw_text: log.raw_text,
        parse: log.parse
      });

      if (log.type === "water") {
        intake_today.water_glasses += log.parse.water_glasses || 0;
      } else if (log.type === "weight") {
        if (log.parse && log.parse.weight_kg) {
          latestWeightKg = log.parse.weight_kg;
        }
      } else if (log.type === "food") {
        if (log.parse && log.parse.food) {
          log.parse.food.forEach(item => {
            if (item.nutrients) {
              intake_today.calories += item.nutrients.calories || 0;
              intake_today.protein_g += item.nutrients.protein_g || 0;
              intake_today.carbs_g += item.nutrients.carbs_g || 0;
              intake_today.fat_g += item.nutrients.fat_g || 0;
              intake_today.fibre_g += item.nutrients.fibre_g || 0;
            }
          });
        }
      }
    });
    
    // Round intake numbers
    intake_today.calories = Math.round(intake_today.calories);
    intake_today.protein_g = Math.round(intake_today.protein_g * 10) / 10;
    intake_today.carbs_g = Math.round(intake_today.carbs_g * 10) / 10;
    intake_today.fat_g = Math.round(intake_today.fat_g * 10) / 10;
    intake_today.fibre_g = Math.round(intake_today.fibre_g * 10) / 10;
    
    // 4. Get active flagged markers from user's latest report
    const { data: latestReport, error: reportErr } = await supabase
      .from("reports")
      .select("id")
      .eq("user_id", userId)
      .eq("parse_status", "completed")
      .order("uploaded_at", { ascending: false })
      .limit(1);
      
    if (reportErr) throw reportErr;
    
    let flagged_markers = [];
    if (latestReport && latestReport.length > 0) {
      const { data: markers, error: markersErr } = await supabase
        .from("report_markers")
        .select("*")
        .eq("report_id", latestReport[0].id)
        .neq("flag", "normal");
        
      if (markersErr) throw markersErr;
      flagged_markers = markers || [];
    }
    
    // 5. Generate a proactive assistant line (serif sentence)
    let proactive_line = "Add a health report and this screen learns your body.";
    if (flagged_markers.length > 0) {
      const lowIron = flagged_markers.find(m => m.marker_id === "iron" && m.flag === "low");
      const lowVitD = flagged_markers.find(m => m.marker_id === "vitamin_d" && m.flag === "low");
      const highHbA1c = flagged_markers.find(m => m.marker_id === "hba1c" && m.flag === "high");
      
      if (lowIron) {
        proactive_line = diet === "vegetarian" 
          ? "Your iron's been quiet. Palak tonight?"
          : "Your iron's been quiet. Palak or chicken tonight?";
      } else if (lowVitD) {
        proactive_line = "Egg yolks or yogurt can help nudge your vitamin D.";
      } else if (highHbA1c) {
        proactive_line = "More fiber stabilizer in your meals helps maintain steady blood sugar.";
      } else {
        proactive_line = "Your markers look stable. Let's maintain this momentum.";
      }
    } else if (profile) {
      proactive_line = "Type or talk to record your meals, weight, or water.";
    }
    
    res.json({
      profile_completed: !!profile,
      targets,
      diet,
      weight_kg: latestWeightKg,
      intake_today,
      logs_today,
      flagged_markers,
      proactive_line
    });
  } catch (err) {
    next(err);
  }
});

// GET /week
router.get("/week", async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Get profile targets
    const { data: profile } = await supabase
      .from("profiles")
      .select("targets")
      .eq("id", userId)
      .maybeSingle();
      
    const targets = profile ? profile.targets : { calories: 2000, protein_g: 60, fibre_g: 30 };
    
    // Fetch logs for the past 7 days
    const pastWeekStart = new Date();
    pastWeekStart.setDate(pastWeekStart.getDate() - 6);
    pastWeekStart.setHours(0, 0, 0, 0);
    
    const { data: logs, error: logsErr } = await supabase
      .from("logs")
      .select("*")
      .eq("user_id", userId)
      .gte("ts", pastWeekStart.toISOString());
      
    if (logsErr) throw logsErr;
    
    // Aggregate by day
    const days = [];
    const attributionMap = {};
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(pastWeekStart);
      d.setDate(d.getDate() + i);
      const dateString = d.toISOString().split("T")[0];
      
      days.push({
        date: dateString,
        calories: 0,
        protein_g: 0,
        carbs_g: 0,
        fat_g: 0,
        fibre_g: 0,
        water_glasses: 0
      });
    }
    
    logs.forEach(log => {
      const logDate = log.ts.split("T")[0];
      const dayData = days.find(day => day.date === logDate);
      
      if (dayData) {
        if (log.type === "water") {
          dayData.water_glasses += log.parse.water_glasses || 0;
        } else if (log.type === "food") {
          if (log.parse && log.parse.food) {
            log.parse.food.forEach(item => {
              if (item.nutrients) {
                dayData.calories += item.nutrients.calories || 0;
                dayData.protein_g += item.nutrients.protein_g || 0;
                dayData.carbs_g += item.nutrients.carbs_g || 0;
                dayData.fat_g += item.nutrients.fat_g || 0;
                dayData.fibre_g += item.nutrients.fibre_g || 0;
                
                // Track attribution
                if (item.dish) {
                  if (!attributionMap[item.dish]) {
                    attributionMap[item.dish] = { count: 0, fibre: 0, protein: 0 };
                  }
                  attributionMap[item.dish].count += 1;
                  attributionMap[item.dish].fibre += item.nutrients.fibre_g || 0;
                  attributionMap[item.dish].protein += item.nutrients.protein_g || 0;
                }
              }
            });
          }
        }
      }
    });
    
    days.forEach(day => {
      day.calories = Math.round(day.calories);
      day.protein_g = Math.round(day.protein_g * 10) / 10;
      day.carbs_g = Math.round(day.carbs_g * 10) / 10;
      day.fat_g = Math.round(day.fat_g * 10) / 10;
      day.fibre_g = Math.round(day.fibre_g * 10) / 10;
    });
    
    // Sort and find top contributors
    const sortedAttribution = Object.entries(attributionMap)
      .map(([dish, stats]) => ({
        dish,
        count: stats.count,
        fibre: Math.round(stats.fibre * 10) / 10,
        protein: Math.round(stats.protein * 10) / 10
      }))
      .sort((a, b) => (b.fibre + b.protein) - (a.fibre + a.protein))
      .slice(0, 3);
      
    let attributionText = "Start logging food to trace report gap closures.";
    if (sortedAttribution.length > 0) {
      const list = sortedAttribution.map(a => a.dish).join(" and ");
      attributionText = `More ${list} this week did this.`;
    }
    
    res.json({
      targets,
      days,
      attribution: attributionText
    });
  } catch (err) {
    next(err);
  }
});

export default router;
