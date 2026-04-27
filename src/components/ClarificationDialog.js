"use client";

export default function ClarificationDialog({ ambiguities, onContinue, onCancel }) {
  if (!ambiguities || ambiguities.length === 0) return null;

  return (
    <div className="dialog-overlay" onClick={onCancel}>
      <div className="dialog-box" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-title">
          <span>🤔</span>
          Clarification Needed
        </div>
        <div className="dialog-description">
          Your prompt has some ambiguities. The system will proceed with reasonable assumptions,
          but you may want to refine your prompt for better results.
        </div>

        {ambiguities.map((amb, i) => (
          <div className="ambiguity-item" key={i}>
            <div className="ambiguity-issue">⚠️ {amb.issue}</div>
            <div className="ambiguity-suggestion">💡 {amb.suggestion}</div>
          </div>
        ))}

        <div className="dialog-actions">
          <button className="btn-secondary" onClick={onCancel}>
            Refine Prompt
          </button>
          <button className="btn-generate" onClick={onContinue} style={{ fontSize: "0.85rem" }}>
            Continue Anyway
          </button>
        </div>
      </div>
    </div>
  );
}
