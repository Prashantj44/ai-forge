/**
 * Pipeline Orchestrator
 * 
 * Runs the 4-stage generation pipeline sequentially:
 * 1. Intent Extraction
 * 2. System Design
 * 3. Schema Generation (UI, API, DB, Auth in parallel)
 * 4. Refinement & Cross-Validation
 * 
 * Tracks timing, cost, and repairs per stage.
 */

import { extractIntent } from "./stage1-intent.js";
import { generateDesign } from "./stage2-design.js";
import { generateSchemas } from "./stage3-schema.js";
import { refineSchemas } from "./stage4-refine.js";
import { validateFull } from "../validation/validator.js";

/**
 * Run the full generation pipeline
 * @param {string} prompt - User's natural language prompt
 * @param {function} onProgress - Callback for stage progress updates
 * @returns {Promise<object>} Complete generation result
 */
export async function runPipeline(prompt, onProgress = () => {}) {
  const pipelineStart = Date.now();
  const stages = [];
  let allRepairs = [];

  try {
    // ============================================================
    // Stage 1: Intent Extraction
    // ============================================================
    onProgress({ stage: 1, name: "Intent Extraction", status: "running" });
    const stage1Start = Date.now();

    const intentResult = await extractIntent(prompt);

    // Check if there are critical ambiguities that need clarification
    const hasCriticalAmbiguities =
      intentResult.result.ambiguities &&
      intentResult.result.ambiguities.length > 3;

    stages.push({
      id: 1,
      name: "Intent Extraction",
      status: "complete",
      latency: Date.now() - stage1Start,
      metrics: intentResult.metrics,
      repairs: intentResult.repairs,
      output: intentResult.result,
    });
    allRepairs.push(...intentResult.repairs);
    onProgress({ stage: 1, name: "Intent Extraction", status: "complete", latency: Date.now() - stage1Start });

    // If extremely vague, return early with clarification needed
    if (hasCriticalAmbiguities && intentResult.result.features.length < 2) {
      return {
        status: "clarification_needed",
        ambiguities: intentResult.result.ambiguities,
        partialResult: intentResult.result,
        stages,
        metrics: {
          totalLatency: Date.now() - pipelineStart,
          totalRepairs: allRepairs.length,
        },
      };
    }

    // ============================================================
    // Stage 2: System Design
    // ============================================================
    onProgress({ stage: 2, name: "System Design", status: "running" });
    const stage2Start = Date.now();

    const designResult = await generateDesign(intentResult.result);

    stages.push({
      id: 2,
      name: "System Design",
      status: "complete",
      latency: Date.now() - stage2Start,
      metrics: designResult.metrics,
      repairs: designResult.repairs,
      output: designResult.result,
    });
    allRepairs.push(...designResult.repairs);
    onProgress({ stage: 2, name: "System Design", status: "complete", latency: Date.now() - stage2Start });

    // ============================================================
    // Stage 3: Schema Generation
    // ============================================================
    onProgress({ stage: 3, name: "Schema Generation", status: "running" });
    const stage3Start = Date.now();

    const schemaResult = await generateSchemas(intentResult.result, designResult.result);

    stages.push({
      id: 3,
      name: "Schema Generation",
      status: "complete",
      latency: Date.now() - stage3Start,
      metrics: schemaResult.metrics,
      repairs: schemaResult.repairs,
      output: {
        ui: schemaResult.ui,
        api: schemaResult.api,
        database: schemaResult.database,
        auth: schemaResult.auth,
      },
    });
    allRepairs.push(...schemaResult.repairs);
    onProgress({ stage: 3, name: "Schema Generation", status: "complete", latency: Date.now() - stage3Start });

    // ============================================================
    // Stage 4: Refinement
    // ============================================================
    onProgress({ stage: 4, name: "Refinement", status: "running" });
    const stage4Start = Date.now();

    const refineResult = await refineSchemas(
      {
        ui: schemaResult.ui,
        api: schemaResult.api,
        database: schemaResult.database,
        auth: schemaResult.auth,
      },
      intentResult.result,
      designResult.result
    );

    stages.push({
      id: 4,
      name: "Refinement",
      status: "complete",
      latency: Date.now() - stage4Start,
      metrics: refineResult.metrics,
      repairs: refineResult.repairs,
      output: refineResult.result,
    });
    allRepairs.push(...refineResult.repairs);
    onProgress({ stage: 4, name: "Refinement", status: "complete", latency: Date.now() - stage4Start });

    // ============================================================
    // Assemble final config
    // ============================================================
    const fullConfig = {
      appName: intentResult.result.appName,
      appType: intentResult.result.appType,
      description: intentResult.result.description,
      ui: refineResult.result.ui,
      api: refineResult.result.api,
      database: refineResult.result.database,
      auth: refineResult.result.auth,
    };

    // Final validation
    const finalValidation = validateFull(fullConfig);

    // Calculate total cost
    const totalCost = stages.reduce((sum, s) => {
      if (s.metrics?.cost) return sum + s.metrics.cost;
      if (s.metrics?.stages) {
        return sum + Object.values(s.metrics.stages).reduce((s2, m) => s2 + (m.cost || 0), 0);
      }
      return sum;
    }, 0);

    const totalTokens = stages.reduce((sum, s) => {
      if (s.metrics?.totalTokens) return sum + s.metrics.totalTokens;
      if (s.metrics?.stages) {
        return sum + Object.values(s.metrics.stages).reduce((s2, m) => s2 + (m.totalTokens || 0), 0);
      }
      return sum;
    }, 0);

    return {
      status: "success",
      config: fullConfig,
      intent: intentResult.result,
      design: designResult.result,
      validation: finalValidation,
      stages,
      metrics: {
        totalLatency: Date.now() - pipelineStart,
        totalCost: parseFloat(totalCost.toFixed(6)),
        totalTokens,
        totalRepairs: allRepairs.length,
        validationScore: finalValidation.score,
        stageLatencies: stages.map((s) => ({
          name: s.name,
          latency: s.latency,
        })),
      },
    };
  } catch (error) {
    console.error("Pipeline error:", error);

    return {
      status: "error",
      error: error.message,
      stages,
      metrics: {
        totalLatency: Date.now() - pipelineStart,
        totalRepairs: allRepairs.length,
      },
    };
  }
}
