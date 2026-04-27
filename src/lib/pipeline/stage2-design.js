/**
 * Stage 2: System Design
 * 
 * Converts extracted intent into application architecture.
 * Defines: entities, fields, relationships, user flows, and role permissions.
 */

import { callLLMWithSchema } from "../llm.js";
import { validateSchema } from "../validation/validator.js";
import { repairConfig } from "../validation/repair.js";

const SYSTEM_PROMPT = `You are an expert software architect who designs database schemas, entity relationships, user flows, and permission systems.

Given an application intent, design the complete system architecture.

RULES:
1. Every entity MUST have an "id" field (type: uuid) and relevant data fields.
2. Define relationships between entities clearly (one-to-one, one-to-many, many-to-many).
3. User flows should cover the main user journeys (registration, CRUD operations, etc.).
4. Permissions must be granular — specify exactly what each role can do.
5. Think about edge cases: what happens when data is deleted? (cascade rules)
6. Include a "User" entity if authentication is involved.
7. Keep field types consistent: use "string" for text, "email" for emails, "date" for dates, etc.`;

const SCHEMA_DESCRIPTION = `{
  "entities": [
    {
      "name": "string (PascalCase entity name, e.g., 'User')",
      "fields": [
        {
          "name": "string (camelCase field name)",
          "type": "one of: string, number, boolean, date, email, password, text, url, enum, json, uuid, float, integer",
          "required": true/false,
          "unique": true/false,
          "defaultValue": "optional default",
          "enumValues": ["optional array of enum options"],
          "description": "optional field description"
        }
      ],
      "relations": [
        {
          "target": "string (target entity name)",
          "type": "one of: one-to-one, one-to-many, many-to-many",
          "foreignKey": "optional FK field name"
        }
      ],
      "timestamps": true
    }
  ],
  "flows": [
    {
      "name": "string (flow name, e.g., 'userRegistration')",
      "description": "string",
      "steps": [
        {
          "action": "string (what happens)",
          "actor": "string (who performs it)",
          "description": "string (details)"
        }
      ]
    }
  ],
  "roles": {
    "roleName": {
      "permissions": ["read", "write", "delete", "etc"],
      "description": "optional description"
    }
  }
}`;

/**
 * Generate system design from intent
 * @param {object} intent - Stage 1 output
 * @returns {Promise<{ result: object, metrics: object, repairs: Array }>}
 */
export async function generateDesign(intent) {
  const userPrompt = `Design the system architecture for this application:

App Name: ${intent.appName}
Type: ${intent.appType}
Description: ${intent.description}

Features:
${intent.features.map((f) => `- ${f.name} (${f.category}): ${f.details}`).join("\n")}

Roles: ${intent.roles.join(", ")}

Assumptions:
${intent.assumptions.map((a) => `- ${a}`).join("\n")}

Design complete entities with fields, relationships, user flows, and role permissions.
Every entity must have an "id" field of type "uuid".`;

  const { result, metrics } = await callLLMWithSchema(
    SYSTEM_PROMPT,
    userPrompt,
    SCHEMA_DESCRIPTION,
    { temperature: 0.15 }
  );

  // Validate
  const validation = validateSchema(result, "design");

  if (validation.valid) {
    return { result: validation.data, metrics, repairs: [] };
  }

  // Attempt repair
  const { repaired, repairs, success } = await repairConfig(
    result,
    "design",
    validation.errors,
    { intent }
  );

  return {
    result: repaired,
    metrics: { ...metrics, repairAttempts: repairs.length },
    repairs,
  };
}
