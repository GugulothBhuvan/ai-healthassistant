// Krutrim OpenAI-compatible client, model registry

import dotenv from "dotenv";
dotenv.config();

const ROLES = {
  intent: "gemma-4-E4B-it",
  parse: "gemma-4-26B-A4B-it",
  vision: "gemma-4-31b-it",
  escalate: "gpt-oss-120b"
};

export async function llm(role, messages, schema) {
  const baseUrl = process.env.KRUTRIM_BASE_URL || "https://cloud.olakrutrim.com/v1";
  const apiKey = process.env.KRUTRIM_API_KEY;

  if (!apiKey) {
    throw new Error("Missing KRUTRIM_API_KEY environment variable");
  }

  const model = ROLES[role] || role;

  const makeRequest = async (selectedModel) => {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: selectedModel,
        messages,
        temperature: 0,
        response_format: { type: "json_object" }
      })
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Krutrim API error (${res.status}): ${errBody}`);
    }

    const data = await res.json();
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error("Krutrim returned an empty or invalid response structure");
    }

    const content = data.choices[0].message.content.trim();
    const parsedJson = JSON.parse(content);
    return schema.parse(parsedJson);
  };

  try {
    // Attempt 1: Regular model
    return await makeRequest(model);
  } catch (error) {
    console.warn(`Error in Krutrim attempt 1 using model ${model}: ${error.message}`);
    try {
      // Attempt 2: Retry with regular model
      console.log("Retrying attempt 2 with same model...");
      return await makeRequest(model);
    } catch (retryError) {
      console.error(`Error in Krutrim attempt 2: ${retryError.message}`);
      if (role !== "escalate") {
        // Attempt 3: Escalate
        console.log(`Escalating to ${ROLES.escalate}...`);
        try {
          return await makeRequest(ROLES.escalate);
        } catch (escalateError) {
          console.error(`Escalation failed: ${escalateError.message}`);
          throw escalateError;
        }
      }
      throw retryError;
    }
  }
}
