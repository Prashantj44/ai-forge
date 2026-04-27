"use client";

import { useState } from "react";
import PromptInput from "@/components/PromptInput";
import PipelineVisualizer from "@/components/PipelineVisualizer";
import SchemaViewer from "@/components/SchemaViewer";
import ExecutionPreview from "@/components/ExecutionPreview";
import MetricsPanel from "@/components/MetricsPanel";
import ClarificationDialog from "@/components/ClarificationDialog";

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
    setCurrentStage(1);

    // Simulate stage progression for visual feedback
    const stageTimer = setInterval(() => {
      setCurrentStage((prev) => {
        if (prev < 4) return prev + 1;
        clearInterval(stageTimer);
        return prev;
      });
    }, 5000);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      clearInterval(stageTimer);
      const data = await response.json();

      if (data.status === "clarification_needed") {
        setClarification(data);
        setStages(data.stages);
        setCurrentStage(0);
        setIsLoading(false);
        return;
      }

      if (data.status === "error") {
        setError(data.error || "An error occurred during generation");
        setStages(data.stages);
        setCurrentStage(0);
        setIsLoading(false);
        return;
      }

      setResult(data);
      setStages(data.stages);
      setCurrentStage(5); // All complete
    } catch (err) {
      clearInterval(stageTimer);
      setError(err.message || "Failed to connect to the generation API");
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
            // Re-run with the partial result as additional context
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
