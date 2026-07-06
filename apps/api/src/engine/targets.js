// Mifflin-St Jeor target computation

export function calculateTargets(profile) {
  const { height_cm, weight_kg, age, sex, activity } = profile;
  
  // Mifflin-St Jeor BMR
  let bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age;
  if (sex === "male") {
    bmr += 5;
  } else {
    bmr -= 161;
  }
  
  // Activity Factor multipliers
  let factor = 1.2;
  if (activity === "somewhere_between") {
    factor = 1.375;
  } else if (activity === "on_my_feet") {
    factor = 1.55;
  }
  
  const TDEE = Math.round(bmr * factor);
  
  // Targets based on blueprint:
  // - calories: TDEE
  // - protein: 0.9 g/kg of body weight
  // - fibre: 30 g
  return {
    calories: TDEE,
    protein_g: Math.round(0.9 * weight_kg * 10) / 10,
    fibre_g: 30
  };
}
