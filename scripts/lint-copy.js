// Lint copy script: checks for banned clinical/diagnostic terms in prompts and user-facing copy

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");

// Define files to scan
const FILES_TO_SCAN = [
  path.join(rootDir, "apps", "web", "src", "lib", "copy.js"),
  path.join(rootDir, "apps", "api", "src", "ai", "prompts", "intent.js"),
  path.join(rootDir, "apps", "api", "src", "ai", "prompts", "foodParse.js"),
  path.join(rootDir, "apps", "api", "src", "ai", "prompts", "reportExtract.js")
];

// Define banned regex patterns
const BANNED_PATTERNS = [
  { regex: /diagnose/i, name: "Diagnosis claims (diagnose)" },
  { regex: /you have/i, name: "Direct clinical possession (you have)" },
  { regex: /cured/i, name: "Clinical cure claims (cured)" },
  { regex: /ferritin is improving/i, name: "Outcome progress claim" },
  { regex: /treat/i, name: "Treatment claims" }
];

let failed = false;

console.log("Starting Copy & Prompt Validation Lint...");

FILES_TO_SCAN.forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    console.warn(`Warning: File not found to scan: ${filePath}`);
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");
  const relPath = path.relative(rootDir, filePath);
  
  BANNED_PATTERNS.forEach(rule => {
    if (rule.regex.test(content)) {
      console.error(`\x1b[31mError: Banned term match found in ${relPath} for: "${rule.name}"\x1b[0m`);
      
      // Find lines matching
      const lines = content.split(/\r?\n/);
      lines.forEach((line, index) => {
        if (rule.regex.test(line)) {
          console.error(`  Line ${index + 1}: ${line.trim()}`);
        }
      });
      failed = true;
    }
  });
});

if (failed) {
  console.error("\x1b[31mLint Failed: Clinical overclaim mitigations violated!\x1b[0m");
  process.exit(1);
} else {
  console.log("\x1b[32mCopy & Prompt Validation Passed.\x1b[0m");
  process.exit(0);
}
