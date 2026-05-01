/**
 * Stage 4: Refinement Layer
 * 
 * Cross-validates all schemas against each other and resolves inconsistencies.
 * Uses targeted repair instead of full regeneration.
 */

import { callLLM } from "../llm.js";
import { validateCrossLayer } from "../validation/validator.js";

/**
 * Refine and cross-validate all schemas
 * @param {object} schemas - { ui, api, database, auth }
 * @param {object} intent - Stage 1 output
 * @param {object} design - Stage 2 output
 * @returns {Promise<{ result: object, metrics: object, repairs: Array }>}
 */
export async function refineSchemas(schemas, intent, design) {
  const startTime = Date.now();
  const repairs = [];

  let current = JSON.parse(JSON.stringify(schemas));

  // Run cross-layer validation
  const crossValidation = validateCrossLayer(current);

  if (crossValidation.valid && crossValidation.warnings.length === 0) {
    return {
      result: current,
      metrics: {
        latency: Date.now() - startTime,
        crossLayerErrors: 0,
        crossLayerWarnings: 0,
        refinementApplied: false,
      },
      repairs: [],
    };
  }

  // If there are only warnings but no errors, skip expensive LLM refinement
  if (crossValidation.errors.length === 0) {
    return {
      result: current,
      metrics: {
        latency: Date.now() - startTime,
        crossLayerErrors: 0,
        crossLayerWarnings: crossValidation.warnings.length,
        refinementApplied: false,
      },
      repairs: [],
    };
  }

  // Only use LLM for actual errors
  const allIssues = [...crossValidation.errors];

  if (allIssues.length > 0) {
    try {
      const issuesSummary = allIssues
        .map((i) => `- [${i.type}] ${i.message} (layer: ${i.layer})`)
        .join("\n");

      const systemPrompt = `You are a system integration specialist. You receive a multi-layer application configuration that has cross-layer inconsistencies.

Your job is to fix ONLY the specific inconsistencies listed. Return the COMPLETE fixed configuration with all 4 layers (ui, api, database, auth).

RULES:
1. Fix missing references by adding the missing items.
2. Fix role mismatches by aligning with the auth config.
3. Fix missing endpoints by adding them to the API config.
4. Preserve all existing valid data — only fix the issues.
5. Keep the structure exactly as received, just fix inconsistencies.`;

      const userPrompt = `## Current Configuration:

### UI Config:
${JSON.stringify(current.ui, null, 2)}

### API Config:
${JSON.stringify(current.api, null, 2)}

### Database Schema:
${JSON.stringify(current.database, null, 2)}

### Auth Config:
${JSON.stringify(current.auth, null, 2)}

## Cross-Layer Issues Found:
${issuesSummary}

## Original Intent:
App: ${intent.appName} — ${intent.description}
Roles: ${intent.roles.join(", ")}

Fix all the listed issues and return the complete configuration as:
{
  "ui": { ... },
  "api": { ... },
  "database": { ... },
  "auth": { ... }
}`;

      const { result, metrics: llmMetrics } = await callLLM(systemPrompt, userPrompt, {
        temperature: 0.1,
      });

      // Merge refined result
      if (result.ui) current.ui = result.ui;
      if (result.api) current.api = result.api;
      if (result.database) current.database = result.database;
      if (result.auth) current.auth = result.auth;

      repairs.push({
        type: "cross-layer-refinement",
        issuesFixed: allIssues.length,
        description: `Refined ${allIssues.length} cross-layer issues`,
        llmMetrics,
      });
    } catch (error) {
      console.error("Refinement LLM call failed:", error.message);
      repairs.push({
        type: "refinement-failed",
        error: error.message,
      });
    }
  }

  // Re-validate after refinement
  const finalValidation = validateCrossLayer(current);

  return {
    result: current,
    metrics: {
      latency: Date.now() - startTime,
      crossLayerErrors: finalValidation.errors.length,
      crossLayerWarnings: finalValidation.warnings.length,
      refinementApplied: true,
      issuesResolved: allIssues.length - finalValidation.errors.length - finalValidation.warnings.length,
    },
    repairs,
  };
}
