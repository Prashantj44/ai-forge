/**
 * LLM Client Wrapper — Thin abstraction over Google Gemini API
 * 
 * Features:
 * - Structured JSON output mode
 * - Low temperature for determinism
 * - Retry with exponential backoff
 * - Model fallback chain (2.5-flash → 2.0-flash → 2.0-flash-lite)
 * - Token/cost tracking per request
 * - Rate limiting awareness
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Model fallback chain — try models in order if one fails
const MODEL_CHAIN = [
  "gemini-2.5-flash-lite",
  "gemini-flash-latest",
  "gemini-flash-lite-latest",
];

// Cost per 1M tokens (Gemini 2.0 Flash pricing)
const COST_PER_1M_INPUT = 0.10;
const COST_PER_1M_OUTPUT = 0.40;

/**
 * Call Gemini with structured JSON output
 * @param {string} systemPrompt - System instruction
 * @param {string} userPrompt - User message
 * @param {object} options - Configuration
 * @returns {Promise<{result: object, metrics: object}>}
 */
export async function callLLM(systemPrompt, userPrompt, options = {}) {
  const {
    temperature = 0.15,
    maxRetries = 6,
    model = null, // null = use fallback chain
  } = options;

  const modelsToTry = model ? [model] : MODEL_CHAIN;
  let lastError = null;

  for (const currentModel of modelsToTry) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const startTime = Date.now();
      try {
        const generativeModel = genAI.getGenerativeModel({
          model: currentModel,
          systemInstruction: systemPrompt,
          generationConfig: {
            temperature,
            responseMimeType: "application/json",
            maxOutputTokens: 16384,
          },
        });

        const result = await generativeModel.generateContent(userPrompt);
        const response = result.response;
        const text = response.text();
        const latency = Date.now() - startTime;

        // Extract usage metadata
        const usage = response.usageMetadata || {};
        const inputTokens = usage.promptTokenCount || 0;
        const outputTokens = usage.candidatesTokenCount || 0;
        const totalTokens = usage.totalTokenCount || 0;

        // Calculate cost
        const cost = (inputTokens / 1_000_000) * COST_PER_1M_INPUT +
                     (outputTokens / 1_000_000) * COST_PER_1M_OUTPUT;

        // Parse JSON response
        let parsed;
        try {
          parsed = JSON.parse(text);
        } catch (parseErr) {
          // Try to repair truncated JSON
          let repaired = text.trim();
          
          // Extract from markdown code blocks if present
          const jsonMatch = repaired.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (jsonMatch) repaired = jsonMatch[1].trim();
          
          // Remove trailing incomplete content
          repaired = repaired.replace(/,\s*$/, '');
          repaired = repaired.replace(/,\s*"[^"]*"\s*:\s*$/, '');
          repaired = repaired.replace(/,\s*"[^"]*$/, '');
          
          // Count and close unclosed brackets/braces
          const ob = (repaired.match(/\{/g) || []).length;
          const cb = (repaired.match(/\}/g) || []).length;
          const os = (repaired.match(/\[/g) || []).length;
          const cs = (repaired.match(/\]/g) || []).length;
          for (let j = 0; j < os - cs; j++) repaired += ']';
          for (let j = 0; j < ob - cb; j++) repaired += '}';
          
          try {
            parsed = JSON.parse(repaired);
          } catch (e2) {
            // Last resort: find valid JSON object/array
            const objMatch = text.match(/(\{[\s\S]*\})/);
            const arrMatch = text.match(/(\[[\s\S]*\])/);
            const match = objMatch || arrMatch;
            if (match) {
              parsed = JSON.parse(match[1]);
            } else {
              throw new Error(`Failed to parse JSON: ${text.substring(0, 200)}`);
            }
          }
        }

        return {
          result: parsed,
          metrics: {
            latency,
            inputTokens,
            outputTokens,
            totalTokens,
            cost: parseFloat(cost.toFixed(6)),
            attempt: attempt + 1,
            model: currentModel,
          },
        };
      } catch (error) {
        lastError = error;
        const errorMsg = error.message || "";
        console.error(`[${currentModel}] attempt ${attempt + 1} failed:`, errorMsg.substring(0, 120));

        // For 429 (quota exceeded), skip to next model immediately
        if (errorMsg.includes("429") && errorMsg.includes("limit: 0")) {
          console.log(`[${currentModel}] quota is 0, skipping to next model`);
          break; // break inner retry loop, move to next model
        }

        // For 503 (overloaded), retry with longer delay
        if (errorMsg.includes("503") || errorMsg.includes("UNAVAILABLE")) {
          if (attempt < maxRetries - 1) {
            const delay = (attempt + 1) * 10000; // 10s, 20s, 30s, 40s, 50s, 60s
            console.log(`[${currentModel}] server overloaded, retrying in ${delay / 1000}s...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }
        }

        // For other errors, standard exponential backoff
        if (attempt < maxRetries - 1) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
  }

  throw new Error(`LLM call failed after trying all models: ${lastError?.message}`);
}

/**
 * Call LLM with a specific JSON schema hint in the prompt
 * Helps enforce structure in the output
 */
export async function callLLMWithSchema(systemPrompt, userPrompt, schemaDescription, options = {}) {
  const enhancedSystem = `${systemPrompt}

CRITICAL OUTPUT RULES:
1. You MUST respond with valid JSON only — no markdown, no explanation.
2. Your response must conform exactly to this schema:
${schemaDescription}
3. All required fields must be present.
4. Do NOT include any fields not specified in the schema.
5. Use consistent, lowercase-with-hyphens naming for IDs and slugs.`;

  return callLLM(enhancedSystem, userPrompt, options);
}
