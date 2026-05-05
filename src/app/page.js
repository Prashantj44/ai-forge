"use client";

import { useState } from "react";
import PromptInput from "@/components/PromptInput";
import PipelineVisualizer from "@/components/PipelineVisualizer";
import SchemaViewer from "@/components/SchemaViewer";
import ExecutionPreview from "@/components/ExecutionPreview";
import MetricsPanel from "@/components/MetricsPanel";
import ClarificationDialog from "@/components/ClarificationDialog";

/**
 * Helper: call a stage API with safe JSON parsing
 */
async function callStage(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      response.status === 504
        ? "Stage timed out — the AI server may be overloaded, please retry"
        : `Server error (${response.status}): ${text.substring(0, 120)}`
    );
  }

  if (data.status === "error") {
    throw new Error(data.error || "Stage failed");
  }

  return data;
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [currentStage, setCurrentStage] = useState(0);
  const [stages, setStages] = useState(null);
  const [clarification, setClarification] = useState(null);

  const handleGenerate = async (prompt) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setStages(null);
    setClarification(null);

    const stageResults = [];
    const allRepairs = [];
    const pipelineStart = Date.now();

    try {
      // ─── Stage 1: Intent Extraction ───
      setCurrentStage(1);
      setStages([
        { id: 1, name: "Intent Extraction", status: "running", latency: 0, repairCount: 0 },
      ]);

      const s1 = await callStage("/api/generate/intent", { prompt });
      const s1Latency = s1.metrics?.latency || 0;
      allRepairs.push(...(s1.repairs || []));

      // Check for critical ambiguities
      if (s1.intent?.ambiguities?.length > 3 && s1.intent?.features?.length < 2) {
        setClarification({
          ambiguities: s1.intent.ambiguities,
          stages: [{ id: 1, name: "Intent Extraction", status: "complete", latency: s1Latency, repairCount: 0 }],
        });
        setStages([{ id: 1, name: "Intent Extraction", status: "complete", latency: s1Latency, repairCount: 0 }]);
        setCurrentStage(0);
        setIsLoading(false);
        return;
      }

      stageResults.push({
        id: 1, name: "Intent Extraction", status: "complete",
        latency: s1Latency, repairCount: s1.repairs?.length || 0,
      });
      setStages([...stageResults]);

      // ─── Stage 2: System Design ───
      setCurrentStage(2);
      setStages([
        ...stageResults,
        { id: 2, name: "System Design", status: "running", latency: 0, repairCount: 0 },
      ]);

      const s2 = await callStage("/api/generate/design", { intent: s1.intent });
      const s2Latency = s2.metrics?.latency || 0;
      allRepairs.push(...(s2.repairs || []));

      stageResults.push({
        id: 2, name: "System Design", status: "complete",
        latency: s2Latency, repairCount: s2.repairs?.length || 0,
      });
      setStages([...stageResults]);

      // ─── Stage 3: Schema Generation ───
      setCurrentStage(3);
      setStages([
        ...stageResults,
        { id: 3, name: "Schema Generation", status: "running", latency: 0, repairCount: 0 },
      ]);

      const s3 = await callStage("/api/generate/schema", { intent: s1.intent, design: s2.design });
      const s3Latency = s3.metrics?.latency || 0;
      allRepairs.push(...(s3.repairs || []));

      stageResults.push({
        id: 3, name: "Schema Generation", status: "complete",
        latency: s3Latency, repairCount: s3.repairs?.length || 0,
      });
      setStages([...stageResults]);

      // ─── Stage 4: Refinement & Assembly ───
      setCurrentStage(4);
      setStages([
        ...stageResults,
        { id: 4, name: "Refinement", status: "running", latency: 0, repairCount: 0 },
      ]);

      const s4 = await callStage("/api/generate/refine", {
        intent: s1.intent,
        design: s2.design,
        schemas: s3.schemas,
        stageMetrics: [s1.metrics, s2.metrics, s3.metrics],
      });
      const s4Latency = s4.metrics?.totalLatency || 0;
      allRepairs.push(...(s4.repairs || []));

      stageResults.push({
        id: 4, name: "Refinement", status: "complete",
        latency: s4Latency, repairCount: s4.repairs?.length || 0,
      });
      setStages([...stageResults]);
      setCurrentStage(5); // All complete

      // Assemble final result
      const totalLatency = Date.now() - pipelineStart;
      setResult({
        config: s4.config,
        intent: s1.intent,
        design: s2.design,
        validation: s4.validation,
        execution: s4.execution,
        stages: stageResults,
        metrics: {
          ...s4.metrics,
          totalLatency,
          totalRepairs: allRepairs.length,
          stageLatencies: stageResults.map((s) => ({
            name: s.name,
            latency: s.latency,
          })),
        },
      });
    } catch (err) {
      setError(err.message || "Generation failed — please try again");
      setCurrentStage(0);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="logo">
          <div className="logo-icon">⚡</div>
          <span className="logo-text">AI Forge</span>
        </div>
        <span className="header-badge">Software Compiler</span>
      </header>

      {/* Hero */}
      <section className="hero">
        <h1 className="hero-title">
          Transform Ideas Into
          <br />
          <span className="gradient-text">Production-Ready Apps</span>
        </h1>
        <p className="hero-subtitle">
          Describe your application in natural language. Our multi-stage AI pipeline
          generates validated UI, API, Database, and Auth configurations — then
          compiles them into a working application.
        </p>
      </section>

      {/* Prompt Input */}
      <section className="section">
        <PromptInput onSubmit={handleGenerate} isLoading={isLoading} />
      </section>

      {/* Pipeline Visualizer */}
      {(isLoading || stages) && (
        <PipelineVisualizer stages={stages} currentStage={currentStage} />
      )}

      {/* Error Display */}
      {error && (
        <div className="error-banner" style={{ marginTop: "var(--space-xl)" }}>
          <span className="error-icon">❌</span>
          <div>
            <strong style={{ display: "block", marginBottom: 4 }}>Generation Failed</strong>
            <span className="error-message">{error}</span>
          </div>
        </div>
      )}

      {/* Clarification Dialog */}
      {clarification && (
        <ClarificationDialog
          ambiguities={clarification.ambiguities}
          onContinue={() => {
            setClarification(null);
          }}
          onCancel={() => setClarification(null)}
        />
      )}

      {/* Results */}
      {result && (
        <>
          {/* Metrics */}
          <section className="section">
            <MetricsPanel metrics={result.metrics} validation={result.validation} />
          </section>

          {/* Schema + Preview Grid */}
          <section className="section">
            <div className="results-grid">
              <SchemaViewer
                config={result.config}
                intent={result.intent}
                design={result.design}
              />
              <ExecutionPreview html={result.execution?.html} />
            </div>
          </section>
        </>
      )}

      {/* Footer */}
      <footer style={{
        textAlign: "center",
        padding: "var(--space-2xl) 0 var(--space-xl)",
        color: "var(--text-tertiary)",
        fontSize: "0.8rem",
        borderTop: "1px solid var(--border-subtle)",
        marginTop: "var(--space-2xl)",
      }}>
        <div style={{ marginBottom: 8 }}>
          <strong style={{ color: "var(--text-secondary)" }}>AI Forge</strong> — A Multi-Stage Software Generation Compiler
        </div>
        <div>
          4-Stage Pipeline • Zod Schema Validation • Intelligent Repair Engine • Execution Simulation
        </div>
      </footer>
    </div>
  );
}
