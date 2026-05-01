/**
 * Main Generation API Endpoint
 * 
 * POST /api/generate
 * Body: { prompt: string }
 * 
 * Runs the full pipeline and returns the generated config + execution preview.
 */

import { NextResponse } from "next/server";
import { runPipeline } from "@/lib/pipeline/index.js";
import { simulateExecution } from "@/lib/execution/simulator.js";

export const maxDuration = 60; // Vercel Hobby max is 60s

export async function POST(request) {
  try {
    const body = await request.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "Prompt is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "your_gemini_api_key_here") {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured. Please add your API key to .env.local" },
        { status: 500 }
      );
    }

    // Run the pipeline
    const pipelineResult = await runPipeline(prompt.trim());

    // If clarification is needed, return early
    if (pipelineResult.status === "clarification_needed") {
      return NextResponse.json({
        status: "clarification_needed",
        ambiguities: pipelineResult.ambiguities,
        partialResult: pipelineResult.partialResult,
        stages: pipelineResult.stages.map(sanitizeStage),
        metrics: pipelineResult.metrics,
      });
    }

    // If pipeline failed
    if (pipelineResult.status === "error") {
      return NextResponse.json({
        status: "error",
        error: pipelineResult.error,
        stages: pipelineResult.stages.map(sanitizeStage),
        metrics: pipelineResult.metrics,
      }, { status: 500 });
    }

    // Generate execution preview
    let executionResult = null;
    try {
      executionResult = await simulateExecution(pipelineResult.config);
    } catch (execError) {
      console.error("Execution simulation failed:", execError);
    }

    return NextResponse.json({
      status: "success",
      config: pipelineResult.config,
      intent: pipelineResult.intent,
      design: pipelineResult.design,
      validation: pipelineResult.validation,
      execution: executionResult
        ? {
            html: executionResult.html,
            metrics: executionResult.metrics,
          }
        : null,
      stages: pipelineResult.stages.map(sanitizeStage),
      metrics: pipelineResult.metrics,
    });
  } catch (error) {
    console.error("Generation API error:", error);
    return NextResponse.json(
      {
        status: "error",
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}

/**
 * Sanitize stage output for client (remove internal data, keep metrics)
 */
function sanitizeStage(stage) {
  return {
    id: stage.id,
    name: stage.name,
    status: stage.status,
    latency: stage.latency,
    repairCount: stage.repairs?.length || 0,
  };
}
