"use client";

export default function MetricsPanel({ metrics, validation }) {
  if (!metrics) return null;

  const validationScore = validation?.score ?? metrics.validationScore ?? 0;
  const scoreClass = validationScore >= 80 ? "high" : validationScore >= 50 ? "medium" : "low";

  return (
    <div className="metrics-panel">
      <div className="metric-card">
        <div className="metric-label">Total Latency</div>
        <div className="metric-value">
          {(metrics.totalLatency / 1000).toFixed(1)}
          <span className="metric-unit">s</span>
        </div>
        {metrics.stageLatencies && (
          <div style={{ marginTop: 8 }}>
            {metrics.stageLatencies.map((s, i) => (
              <div key={i} style={{ fontSize: "0.72rem", color: "var(--text-tertiary)", marginTop: 2 }}>
                {s.name}: {(s.latency / 1000).toFixed(1)}s
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="metric-card">
        <div className="metric-label">Validation Score</div>
        <div className="metric-value">
          {validationScore}
          <span className="metric-unit">/ 100</span>
        </div>
        <div className="validation-bar">
          <div
            className={`validation-fill ${scoreClass}`}
            style={{ width: `${validationScore}%` }}
          />
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-label">Repairs Applied</div>
        <div className="metric-value">{metrics.totalRepairs || 0}</div>
        <div style={{ fontSize: "0.72rem", color: "var(--text-tertiary)", marginTop: 4 }}>
          {metrics.totalRepairs === 0 ? "Clean generation ✨" : "Auto-healed issues"}
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-label">Estimated Cost</div>
        <div className="metric-value">
          ${(metrics.totalCost || 0).toFixed(4)}
        </div>
        <div style={{ fontSize: "0.72rem", color: "var(--text-tertiary)", marginTop: 4 }}>
          {metrics.totalTokens?.toLocaleString() || 0} tokens used
        </div>
      </div>

      {validation && (
        <>
          <div className="metric-card">
            <div className="metric-label">Structural Errors</div>
            <div className="metric-value" style={{ 
              background: validation.structuralErrors?.length === 0 ? "var(--accent-success)" : "var(--accent-error)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}>
              {validation.structuralErrors?.length || 0}
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-label">Cross-Layer Issues</div>
            <div className="metric-value" style={{ 
              background: validation.crossLayerErrors?.length === 0 ? "var(--accent-success)" : "var(--accent-warning)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}>
              {(validation.crossLayerErrors?.length || 0) + (validation.crossLayerWarnings?.length || 0)}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
