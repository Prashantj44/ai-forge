/**
 * Stage 4: Refinement & Assembly API
 * POST /api/generate/refine
 * Body: { intent, design, schemas }
 */

import { NextResponse } from "next/server";
import { refineSchemas } from "@/lib/pipeline/stage4-refine.js";
import { validateFull } from "@/lib/validation/validator.js";
import { simulateExecution } from "@/lib/execution/simulator.js";

export const maxDuration = 60;

export async function POST(request) {
  try {
    const { intent, design, schemas, stageMetrics } = await request.json();

    if (!intent || !schemas) {
      return NextResponse.json({ error: "Intent and schemas are required" }, { status: 400 });
    }

    const startTime = Date.now();

    // Refine schemas
    const refineResult = await refineSchemas(schemas, intent, design || {});

    // Assemble final config
    const fullConfig = {
      appName: intent.appName,
      appType: intent.appType,
      description: intent.description,
      ui: refineResult.result.ui,
      api: refineResult.result.api,
      database: refineResult.result.database,
      auth: refineResult.result.auth,
    };

    // Validate
    const finalValidation = validateFull(fullConfig);

    // Generate execution preview (deterministic, no LLM)
    let executionResult = null;
    try {
      executionResult = await simulateExecution(fullConfig);
    } catch (execError) {
      console.error("Execution simulation failed:", execError);
    }

    // Calculate total metrics from all stages
    const allMetrics = stageMetrics || [];
    const totalCost = allMetrics.reduce((sum, m) => sum + (m?.cost || 0), 0) +
      (refineResult.metrics?.cost || 0);
    const totalTokens = allMetrics.reduce((sum, m) => sum + (m?.totalTokens || 0), 0);
    const totalRepairs = allMetrics.reduce((sum, m) => sum + (m?.repairs || 0), 0) +
      (refineResult.repairs?.length || 0);

    return NextResponse.json({
      status: "success",
      config: fullConfig,
      intent,
      design,
      validation: finalValidation,
      execution: executionResult ? {
        html: executionResult.html,
        metrics: executionResult.metrics,
      } : null,
      metrics: {
        totalLatency: Date.now() - startTime,
        totalCost: parseFloat(totalCost.toFixed(6)),
        totalTokens,
        totalRepairs,
        validationScore: finalValidation.score,
      },
      repairs: refineResult.repairs,
    });
  } catch (error) {
    console.error("Refine API error:", error);
    return NextResponse.json(
      { status: "error", error: error.message || "Refinement failed" },
      { status: 500 }
    );
  }
}
