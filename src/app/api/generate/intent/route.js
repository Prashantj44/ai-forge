/**
 * Stage 1: Intent Extraction API
 * POST /api/generate/intent
 * Body: { prompt: string }
 */

import { NextResponse } from "next/server";
import { extractIntent } from "@/lib/pipeline/stage1-intent.js";

export const maxDuration = 60;

export async function POST(request) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
    }

    const startTime = Date.now();
    const intentResult = await extractIntent(prompt.trim());

    return NextResponse.json({
      status: "success",
      intent: intentResult.result,
      metrics: { ...intentResult.metrics, latency: Date.now() - startTime },
      repairs: intentResult.repairs,
    });
  } catch (error) {
    console.error("Intent API error:", error);
    return NextResponse.json(
      { status: "error", error: error.message || "Intent extraction failed" },
      { status: 500 }
    );
  }
}
