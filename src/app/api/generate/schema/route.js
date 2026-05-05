/**
 * Stage 3: Schema Generation API
 * POST /api/generate/schema
 * Body: { intent: object, design: object }
 */

import { NextResponse } from "next/server";
import { generateSchemas } from "@/lib/pipeline/stage3-schema.js";

export const maxDuration = 60;

export async function POST(request) {
  try {
    const { intent, design } = await request.json();

    if (!intent || !design) {
      return NextResponse.json({ error: "Intent and design data are required" }, { status: 400 });
    }

    const startTime = Date.now();
    const schemaResult = await generateSchemas(intent, design);

    return NextResponse.json({
      status: "success",
      schemas: {
        ui: schemaResult.ui,
        api: schemaResult.api,
        database: schemaResult.database,
        auth: schemaResult.auth,
      },
      metrics: { ...schemaResult.metrics, latency: Date.now() - startTime },
      repairs: schemaResult.repairs,
    });
  } catch (error) {
    console.error("Schema API error:", error);
    return NextResponse.json(
      { status: "error", error: error.message || "Schema generation failed" },
      { status: 500 }
    );
  }
}
