/**
 * Evaluation API Endpoint
 * 
 * POST /api/evaluate
 * Body: { count?: number } — optional number of prompts to test (default: all 20)
 * 
 * Runs evaluation framework and returns metrics.
 */

import { NextResponse } from "next/server";
import { runEvaluation } from "@/lib/evaluation/runner.js";
import { testDataset } from "@/lib/evaluation/dataset.js";

export const maxDuration = 300; // Allow up to 5 minutes for full evaluation

export async function POST(request) {
  try {
    const body = await request.json();
    const count = body.count || testDataset.length;

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "your_gemini_api_key_here") {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const prompts = testDataset.slice(0, count);
    const results = await runEvaluation(prompts);

    return NextResponse.json({
      status: "success",
      ...results,
    });
  } catch (error) {
    console.error("Evaluation API error:", error);
    return NextResponse.json(
      { status: "error", error: error.message },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve the test dataset
export async function GET() {
  return NextResponse.json({
    dataset: testDataset.map((t) => ({
      id: t.id,
      category: t.category,
      prompt: t.prompt,
    })),
    total: testDataset.length,
  });
}
