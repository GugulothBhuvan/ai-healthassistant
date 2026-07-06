// Verification test script for Aarogya engine calculations

import { calculateTargets } from "../apps/api/src/engine/targets.js";
import { scaleNutrients } from "../apps/api/src/engine/portions.js";
import { getDishNutrients, calculateMarkerDeltas } from "../apps/api/src/engine/markers.js";

console.log("Running engine calculations verification...");

// 1. Test Targets calculation (Mifflin-St Jeor)
const profile = {
  height_cm: 165,
  weight_kg: 55,
  age: 28,
  sex: "female",
  activity: "somewhere_between",
  diet: "vegetarian"
};
const targets = calculateTargets(profile);
console.log("Computed Targets:", targets);

const expectedBmr = 10 * 55 + 6.25 * 165 - 5 * 28 - 161; // 550 + 1031.25 - 140 - 161 = 1280.25
const expectedCalories = Math.round(expectedBmr * 1.375); // 1280.25 * 1.375 = 1760
const expectedProtein = Math.round(0.9 * 55 * 10) / 10; // 49.5

if (targets.calories === expectedCalories && targets.protein_g === expectedProtein && targets.fibre_g === 30) {
  console.log("✅ Targets calculation passed.");
} else {
  console.error("❌ Targets calculation failed.", { expectedCalories, expectedProtein, got: targets });
  process.exit(1);
}

// 2. Test Portions scaling (S/M/L multipliers)
const nutrients = {
  calories: 200,
  protein_g: 10,
  carbs_g: 30,
  fat_g: 5,
  fibre_g: 2,
  iron_mg: 1.5,
  vitamin_d_mcg: 1.0
};
const small = scaleNutrients(nutrients, "small");
const large = scaleNutrients(nutrients, "large");

if (small.calories === 150 && large.calories === 300 && small.protein_g === 7.5 && large.protein_g === 15) {
  console.log("✅ Portion scaling passed.");
} else {
  console.error("❌ Portion scaling failed.", { small, large });
  process.exit(1);
}

// 3. Test Marker linking
const palakPaneer = getDishNutrients("Palak Paneer");
if (palakPaneer && palakPaneer.iron_mg === 4.1 && palakPaneer.vitamin_d_mcg === 0.8) {
  console.log("✅ IFCT food matching passed.");
} else {
  console.error("❌ IFCT food matching failed.", palakPaneer);
  process.exit(1);
}

const flaggedMarkers = [{ marker_id: "iron", flag: "low" }];
const deltas = calculateMarkerDeltas(
  { iron_mg: 4.1, vitamin_d_mcg: 0.8, fibre_g: 3.0 },
  flaggedMarkers,
  []
);

if (deltas[0].marker_id === "iron" && deltas[0].contributed === true) {
  console.log("✅ Marker gap contribution linking passed.");
} else {
  console.error("❌ Marker gap contribution linking failed.", deltas);
  process.exit(1);
}

console.log("All engine verification checks passed successfully!");
process.exit(0);
