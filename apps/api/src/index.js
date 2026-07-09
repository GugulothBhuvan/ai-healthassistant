// Express API bootstrap, JWT middleware

import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import { supabase } from "./db.js";

// Import routers
import homeRouter from "./routes/home.js";
import assistantRouter from "./routes/assistant.js";
import speechRouter from "./routes/speech.js";
import reportsRouter from "./routes/reports.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Enable CORS and parsing middleware.
// JSON limit raised well past Express's 100kb default: /assistant/exchange
// carries base64-encoded voice recordings, which inflate ~33% over raw audio
// size and can easily be several hundred KB for a few seconds of speech.
app.use(cors());
app.use(express.json({ limit: "15mb" }));
app.use(morgan("dev"));

// JWT Verification Middleware
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid Authorization header" });
    }

    const token = authHeader.split(" ")[1];

    // Local dev fallback — only engages when this server has no real Supabase
    // project configured. Once SUPABASE_URL/KEY are real, this branch is dead
    // code, so a client can never bypass verification by guessing a token.
    const noRealSupabaseConfigured =
      !process.env.SUPABASE_URL ||
      process.env.SUPABASE_URL.includes("mock") ||
      process.env.SUPABASE_URL.includes("placeholder");

    if (noRealSupabaseConfigured) {
      let userId = "d0a84e2a-14d9-4824-9b2f-764bc5f22f77";
      if (token && token.startsWith("mock-token-")) {
        userId = token.replace("mock-token-", "");
      }
      req.user = {
        id: userId,
        email: "demo@aarogya.in",
        role: "authenticated"
      };
      return next();
    }

    // Call Supabase GoTrue to verify the JWT session
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      console.warn("Auth rejected:", error ? error.message : "no user for token");
      return res.status(401).json({ error: error ? error.message : "Invalid or expired session" });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(500).json({ error: "Internal Auth Middleware error", details: err.message });
  }
};

// Public health check route
app.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Apply JWT authentication to all business endpoints
app.use(authenticateUser);

// Mount API routers
app.use("/", homeRouter); // includes /onboarding, /home, /week
app.use("/assistant", assistantRouter); // includes /exchange, /confirm
app.use("/speech", speechRouter); // includes /stt, /tts
app.use("/reports", reportsRouter); // includes /reports, /reports/:id/flags

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandle API Error:", err);
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined
  });
});

// Start Express server
app.listen(PORT, () => {
  console.log(`Aarogya API running on port ${PORT}`);
});
