/**
 * Stage 1: Intent Extraction
 * 
 * Parses raw user prompt into structured intermediate representation.
 * Identifies: application type, features, roles, assumptions, and ambiguities.
 */

import { callLLMWithSchema } from "../llm.js";
import { validateSchema } from "../validation/validator.js";
import { repairConfig } from "../validation/repair.js";

const SYSTEM_PROMPT = `You are an expert software architect specializing in requirements analysis.
Your job is to analyze a natural language application description and extract structured intent.

RULES:
1. Identify ALL features mentioned or implied by the description.
2. Assign each feature a category: auth, data, ui, logic, integration, analytics, payment, communication, storage, or other.
3. Identify user roles — if none specified, default to ["admin", "user"].
4. Document any assumptions you make.
5. Flag any ambiguities where the user's intent is unclear.
6. Assess complexity as low/medium/high based on feature count and interactions.
7. If the prompt is extremely vague (e.g., "make me an app"), still extract what you can and list ambiguities.
8. Generate a reasonable app name based on the description.`;

const SCHEMA_DESCRIPTION = `{
  "appName": "string (creative name for the app)",
  "appType": "one of: business, ecommerce, social, productivity, education, healthcare, entertainment, utility, other",
  "description": "string (one-paragraph description of the application)",
  "features": [
    {
      "name": "string (feature name)",
      "category": "one of: auth, data, ui, logic, integration, analytics, payment, communication, storage, other",
      "details": "string (what exactly this feature does)",
      "priority": "one of: must-have, nice-to-have"
    }
  ],
  "roles": ["string (role names)"],
  "assumptions": ["string (assumptions made about unclear requirements)"],
  "ambiguities": [
    {
      "issue": "string (what is unclear)",
      "suggestion": "string (suggested clarification question)"
    }
  ],
  "complexity": "one of: low, medium, high"
}`;

/**
 * Extract intent from user prompt
 * @param {string} prompt - Raw user prompt
 * @returns {Promise<{ result: object, metrics: object, repairs: Array }>}
 */
export async function extractIntent(prompt) {
  const userPrompt = `Analyze this application request and extract structured intent:

"${prompt}"

Be thorough — identify both explicit and implied features. If the request is vague, still provide your best interpretation and list all ambiguities.`;

  const { result, metrics } = await callLLMWithSchema(
    SYSTEM_PROMPT,
    userPrompt,
    SCHEMA_DESCRIPTION,
    { temperature: 0.15 }
  );

  // Validate against schema
  const validation = validateSchema(result, "intent");

  if (validation.valid) {
    return { result: validation.data, metrics, repairs: [] };
  }

  // Attempt repair
  const { repaired, repairs, success } = await repairConfig(
    result,
    "intent",
    validation.errors,
    {}
  );

  if (!success) {
    // Even if not perfectly valid, return what we have with error info
    console.warn("Intent extraction produced partially valid output");
  }

  return {
    result: repaired,
    metrics: { ...metrics, repairAttempts: repairs.length },
    repairs,
  };
}
