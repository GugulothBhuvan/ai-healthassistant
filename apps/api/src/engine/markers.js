// marker->nutrient map, verdict rules

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ifctPath = path.join(__dirname, "data", "ifct.json");
const markersPath = path.join(__dirname, "data", "markers.json");

export const ifctDb = JSON.parse(fs.readFileSync(ifctPath, "utf8"));
export const markersDb = JSON.parse(fs.readFileSync(markersPath, "utf8"));

// Daily RDA targets for Indian adults
export const NUTRIENT_RDA = {
  iron_mg: 20,         // 20 mg/day
  vitamin_d_mcg: 15,   // 15 mcg/day (600 IU)
  fibre_g: 30          // 30 g/day
};

export function getDishNutrients(dishName) {
  // Find exact case-insensitive match
  const normalizedKey = Object.keys(ifctDb).find(
    (key) => ifctDb[key].dish.toLowerCase() === dishName.toLowerCase()
  );
  if (normalizedKey) {
    return { ...ifctDb[normalizedKey], ifct_id: normalizedKey };
  }
  return null;
}

export function calculateMarkerDeltas(newNutrients, flaggedMarkers, weeklyLogs = []) {
  return flaggedMarkers.map((marker) => {
    const markerRules = markersDb[marker.marker_id];
    if (!markerRules) {
      return { marker_id: marker.marker_id, contributed: false, weekly_progress_pct: null };
    }

    let contributed = false;
    let newIntake = 0;
    let weeklyIntake = 0;

    // Track primary positive nutrient for progress calculation
    // e.g. for iron -> iron_mg, for vitamin_d -> vitamin_d_mcg, for hba1c -> fibre_g
    const primaryNutrient = markerRules.id === "hba1c" ? "fibre_g" : markerRules.nutrients[0];

    // Check contribution
    markerRules.nutrients.forEach((nut) => {
      if (newNutrients[nut] > 0) {
        contributed = true;
      }
    });

    if (primaryNutrient) {
      newIntake = newNutrients[primaryNutrient] || 0;
      
      // Sum the logged nutrients of the same type for the past week
      weeklyLogs.forEach((log) => {
        if (log.parse && log.parse.food) {
          log.parse.food.forEach((item) => {
            const scaled = item.nutrients || {};
            if (scaled[primaryNutrient]) {
              weeklyIntake += scaled[primaryNutrient];
            }
          });
        }
      });
    }

    let weekly_progress_pct = null;
    if (primaryNutrient) {
      const rda = NUTRIENT_RDA[primaryNutrient] || 30;
      const totalWeeklyTarget = rda * 7;
      const totalIntake = weeklyIntake + newIntake;
      weekly_progress_pct = Math.min(200, Math.round((totalIntake / totalWeeklyTarget) * 100));
    }

    return {
      marker_id: marker.marker_id,
      contributed,
      weekly_progress_pct
    };
  });
}
