// Supabase service-role client (server-side only)

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn("WARNING: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not defined. Database operations may fail.");
}

// Disable auth storage since we're acting as a stateless backend service
export const supabase = createClient(
  supabaseUrl || "https://mock.supabase.co",
  supabaseServiceKey || "mock-service-role-key",
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);
