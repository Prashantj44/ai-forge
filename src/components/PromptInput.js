"use client";

import { useState } from "react";

const EXAMPLE_PROMPTS = [
  "CRM with login, contacts & analytics",
  "E-commerce store with cart & payments",
  "Project management with kanban boards",
  "Blog platform with comments & admin",
  "Restaurant booking system",
  "Fitness tracker with social features",
];

export default function PromptInput({ onSubmit, isLoading }) {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = () => {
    if (prompt.trim() && !isLoading) {
      onSubmit(prompt.trim());
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handleSubmit();
    }
  };

  return (
    <div className="prompt-container">
      <div className="prompt-box">
        <textarea
          id="prompt-input"
          className="prompt-textarea"
          placeholder="Describe the application you want to build...&#10;&#10;Example: Build a CRM with login, contacts, dashboard, role-based access, and premium plan with payments. Admins can see analytics."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          rows={4}
        />
        <div className="prompt-footer">
          <span className="char-count">{prompt.length} chars • Ctrl+Enter to generate</span>
          <button
            id="btn-generate"
            className="btn-generate"
            onClick={handleSubmit}
            disabled={!prompt.trim() || isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner" />
                Generating...
              </>
            ) : (
              <>
                <span>⚡</span>
                Generate App
              </>
            )}
          </button>
        </div>
      </div>

      <div className="examples-section">
        <div className="examples-label">Try an example</div>
        <div className="examples-grid">
          {EXAMPLE_PROMPTS.map((example, i) => (
            <button
              key={i}
              className="example-chip"
              onClick={() => setPrompt(example)}
              disabled={isLoading}
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
