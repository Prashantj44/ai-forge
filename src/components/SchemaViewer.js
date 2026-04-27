"use client";

import { useState, useCallback } from "react";

const TABS = [
  { id: "full", label: "Full Config" },
  { id: "ui", label: "UI Schema" },
  { id: "api", label: "API Schema" },
  { id: "database", label: "DB Schema" },
  { id: "auth", label: "Auth Rules" },
  { id: "intent", label: "Intent" },
  { id: "design", label: "Design" },
];

function syntaxHighlight(json) {
  if (typeof json !== "string") {
    json = JSON.stringify(json, null, 2);
  }

  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\\-]?\d+)?)/g,
    (match) => {
      let cls = "json-number";
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = "json-key";
        } else {
          cls = "json-string";
        }
      } else if (/true|false/.test(match)) {
        cls = "json-boolean";
      } else if (/null/.test(match)) {
        cls = "json-null";
      }
      return `<span class="${cls}">${match}</span>`;
    }
  );
}

export default function SchemaViewer({ config, intent, design }) {
  const [activeTab, setActiveTab] = useState("full");
  const [copied, setCopied] = useState(false);

  const getContent = useCallback(() => {
    if (!config) return null;
    switch (activeTab) {
      case "full": return config;
      case "ui": return config.ui;
      case "api": return config.api;
      case "database": return config.database;
      case "auth": return config.auth;
      case "intent": return intent;
      case "design": return design;
      default: return config;
    }
  }, [activeTab, config, intent, design]);

  const handleCopy = async () => {
    const content = getContent();
    if (content) {
      await navigator.clipboard.writeText(JSON.stringify(content, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!config) return null;

  const content = getContent();

  return (
    <div className="schema-viewer">
      <div className="schema-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`schema-tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="schema-content" style={{ position: "relative" }}>
        <button className="copy-btn" onClick={handleCopy}>
          {copied ? "✓ Copied" : "📋 Copy"}
        </button>
        <div
          className="json-display"
          dangerouslySetInnerHTML={{
            __html: syntaxHighlight(JSON.stringify(content, null, 2)),
          }}
        />
      </div>
    </div>
  );
}
