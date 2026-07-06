// S/M/L multipliers and defaults

export const PORTION_MULTIPLIERS = {
  small: 0.75,
  medium: 1.0,
  large: 1.5
};

export function scaleNutrients(nutrients, size) {
  const mult = PORTION_MULTIPLIERS[size] || 1.0;
  return {
    calories: Math.round(nutrients.calories * mult * 10) / 10,
    protein_g: Math.round(nutrients.protein_g * mult * 10) / 10,
    carbs_g: Math.round(nutrients.carbs_g * mult * 10) / 10,
    fat_g: Math.round(nutrients.fat_g * mult * 10) / 10,
    fibre_g: Math.round(nutrients.fibre_g * mult * 10) / 10,
    iron_mg: Math.round(nutrients.iron_mg * mult * 10) / 10,
    vitamin_d_mcg: Math.round(nutrients.vitamin_d_mcg * mult * 10) / 10
  };
}
