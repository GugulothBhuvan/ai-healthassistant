// fetch wrapper (JWT header, error states)

import { supabase } from "./supabase.js";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

/**
 * Helper to fetch token from Supabase auth session.
 * Returns mock token if in dev mock environment.
 */
async function getJwtToken() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) return session.access_token;
  
  // Check if supabase config is mock
  const isMock = 
    !import.meta.env.VITE_SUPABASE_URL || 
    import.meta.env.VITE_SUPABASE_URL.includes("mock") ||
    import.meta.env.VITE_SUPABASE_URL.includes("placeholder");
    
  if (isMock) {
    return "mock-token-123";
  }
  return null;
}

/**
 * Standard API request wrapper that automatically attaches the Supabase JWT.
 * @param {string} endpoint e.g., '/home' or 'assistant/exchange'
 * @param {RequestInit} options
 */
export async function apiFetch(endpoint, options = {}) {
  const token = await getJwtToken();
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : "/" + endpoint}`;
  
  const headers = { ...options.headers };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  const config = { ...options, headers };
  
  // Check if body is plain object, format as JSON if so
  if (options.body && !(options.body instanceof FormData) && !headers["Content-Type"]) {
    config.headers["Content-Type"] = "application/json";
    config.body = JSON.stringify(options.body);
  }
  
  const res = await fetch(url, config);
  
  if (!res.ok) {
    let errorMsg = "";
    try {
      const errJson = await res.json();
      errorMsg = errJson.error || errJson.message || res.statusText;
    } catch {
      errorMsg = await res.text();
    }
    throw new Error(errorMsg || `HTTP request failed: ${res.status}`);
  }
  
  return res.json();
}
