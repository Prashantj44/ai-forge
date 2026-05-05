/**
 * Stage 2: System Design API
 * POST /api/generate/design
 * Body: { intent: object }
 */

import { NextResponse } from "next/server";
import { generateDesign } from "@/lib/pipeline/stage2-design.js";

export const maxDuration = 60;

export async function POST(request) {
  try {
    const { intent } = await request.json();

    if (!intent) {
      return NextResponse.json({ error: "Intent data is required" }, { status: 400 });
    }

    const startTime = Date.now();
    const designResult = await generateDesign(intent);

    return NextResponse.json({
      status: "success",
      design: designResult.result,
      metrics: { ...designResult.metrics, latency: Date.now() - startTime },
      repairs: designResult.repairs,
    });
  } catch (error) {
    console.error("Design API error:", error);
    return NextResponse.json(
      { status: "error", error: error.message || "Design generation failed" },
      { status: 500 }
    );
  }
}
