// client, anonymous session bootstrap

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if credentials are mock/missing
const isMock = 
  !supabaseUrl || 
  !supabaseAnonKey || 
  supabaseUrl.includes("mock") || 
  supabaseUrl.includes("placeholder");

export const supabase = createClient(
  supabaseUrl || "https://mock-db.supabase.co",
  supabaseAnonKey || "mock-anon-key-12345"
);

/**
 * Ensures an active authenticated session exists.
 * Triggers anonymous auth on first load if no session exists.
 * Falls back to local mock token if in dev mode without keys.
 */
export async function bootstrapSession() {
  if (isMock) {
    console.warn("Aarogya: Running in client MOCK auth mode.");
    // Simulate a brief loading state for UX testing
    await new Promise((r) => setTimeout(r, 400));

    let mockUserId = localStorage.getItem("aarogya_mock_user_id");
    if (!mockUserId) {
      mockUserId = "usr_" + Math.random().toString(36).substring(2, 15) + "_" + Date.now();
      localStorage.setItem("aarogya_mock_user_id", mockUserId);
    }

    return {
      session: {
        access_token: `mock-token-${mockUserId}`,
        user: {
          id: mockUserId,
          email: "demo@aarogya.in"
        }
      }
    };
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    return { session };
  }

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) {
    console.error("Supabase anonymous sign-in failed:", error.message);
    throw error;
  }
  return data;
}
