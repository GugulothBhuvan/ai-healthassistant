import { z } from "zod";

// ---- shared primitives ----
export const PortionSize = z.enum(["small", "medium", "large"]);

export const FoodItemSchema = z.object({
  dish: z.string(),
  // The LLM parse doesn't emit this — it's resolved server-side against the
  // IFCT table at confirm time, so it must not be required of the model.
  ifct_id: z.string().nullable().optional().default(null),
  size: PortionSize,
  confidence: z.number().min(0).max(1),
});

// ---- POST /assistant/exchange ----
export const ExchangeRequestSchema = z.object({
  text: z.string().optional(),
  audio: z.string().optional(), // base64
}).refine((v) => v.text || v.audio, { message: "text or audio required" });

// Fields are optional-with-defaults because LLMs frequently omit null/empty
// fields from JSON output instead of emitting them explicitly.
export const ParsedExchangeSchema = z.object({
  heard: z.string(),
  food: z.array(FoodItemSchema).default([]),
  water_glasses: z.number().int().min(0).nullable().optional().default(null),
  weight_kg: z.number().nullable().optional().default(null),
  unknown: z.array(z.string()).default([]),
  iron_relevant: z.boolean().optional().default(false),
  decline: z.string().nullable().optional().default(null),
  activity: z.object({
    label: z.string(),
    kcal_est: z.number().nullable().optional().default(null),
    minutes: z.number().nullable().optional().default(null),
  }).nullable().optional().default(null),
  medicine: z.object({
    name: z.string(),
    dose_text: z.string().nullable().optional().default(null),
    source: z.enum(["prescription", "user"]).nullable().optional().default(null),
  }).nullable().optional().default(null),
  steps: z.number().int().min(0).nullable().optional().default(null),
  sleep: z.object({
    hours: z.number().nullable().optional().default(null),
  }).nullable().optional().default(null),
});

export const ExchangeResponseSchema = z.object({
  transcript: z.string(),
  parsed: ParsedExchangeSchema,
  confirm_token: z.string(),
});

// ---- POST /assistant/confirm ----
export const ConfirmRequestSchema = z.object({
  confirm_token: z.string(),
  // Absent/null means "use each logged item's own parsed size" — a size
  // override is optional, never required to commit a log (PRD F3 AC4).
  size: PortionSize.nullable().optional(),
});

export const MarkerDeltaSchema = z.object({
  marker_id: z.string(),
  contributed: z.boolean(),
  weekly_progress_pct: z.number().min(0).max(200).nullable(),
});

export const ConfirmResponseSchema = z.object({
  logs_created: z.array(z.string()), // log ids
  intake_delta: z.object({
    calories: z.number(),
    protein_g: z.number(),
    carbs_g: z.number(),
    fat_g: z.number(),
    fibre_g: z.number(),
  }),
  marker_deltas: z.array(MarkerDeltaSchema),
  toast_key: z.string(),
  toast_slots: z.record(z.string(), z.string()).optional(),
});

// ---- onboarding / targets ----
export const OnboardingProfileSchema = z.object({
  name: z.string().optional().nullable(),
  height_cm: z.number().int().positive(),
  weight_kg: z.number().int().positive(),
  age: z.number().int().positive(),
  sex: z.enum(["male", "female"]),
  diet: z.enum(["vegetarian", "eggs_ok", "non_veg"]),
  activity: z.enum(["mostly_sitting", "somewhere_between", "on_my_feet"]),
  dream_weight_kg: z.number().positive().optional().nullable(),
  goal: z.string().optional().nullable(),
  actions: z.array(z.string()).optional().nullable(),
  custom_targets: z.object({
    calories: z.number(),
    protein_g: z.number(),
    fibre_g: z.number()
  }).optional().nullable()
});

export const TargetsSchema = z.object({
  calories: z.number(),
  protein_g: z.number(),
  fibre_g: z.number(),
});

// ---- reports ----
export const ReportUploadResponseSchema = z.object({
  report_id: z.string(),
});

export const VerdictClass = z.enum(["food_fixable", "doctors_territory", "both"]);

export const FlagSchema = z.object({
  marker_id: z.string(),
  label: z.string(),
  value: z.number(),
  unit: z.string(),
  range_low: z.number(),
  range_high: z.number(),
  verdict_class: VerdictClass,
  confidence: z.number().min(0).max(1),
});

export const FlagsResponseSchema = z.object({
  flags: z.array(FlagSchema),
  low_confidence_tray: z.array(z.string()),
  in_range_count: z.number().int().min(0),
});
