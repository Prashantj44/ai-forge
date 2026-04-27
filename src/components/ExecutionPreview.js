"use client";

import { useState, useRef, useEffect } from "react";

export default function ExecutionPreview({ html }) {
  const [device, setDevice] = useState("desktop");
  const iframeRef = useRef(null);

  const deviceWidths = {
    desktop: "100%",
    tablet: "768px",
    mobile: "375px",
  };

  useEffect(() => {
    if (iframeRef.current && html) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
      }
    }
  }, [html]);

  if (!html) return null;

  return (
    <div className="preview-container">
      <div className="preview-header">
        <div className="preview-title">
          <span className="preview-dot" />
          Live Preview
        </div>
        <div className="device-toggle">
          {Object.keys(deviceWidths).map((d) => (
            <button
              key={d}
              className={`device-btn ${device === d ? "active" : ""}`}
              onClick={() => setDevice(d)}
            >
              {d === "desktop" ? "🖥️" : d === "tablet" ? "📱" : "📲"}
            </button>
          ))}
        </div>
      </div>
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        background: "#ffffff",
        borderRadius: "0 0 var(--radius-xl) var(--radius-xl)",
        overflow: "hidden"
      }}>
        <iframe
          ref={iframeRef}
          className="preview-frame"
          title="Generated App Preview"
          sandbox="allow-scripts allow-same-origin"
          style={{
            width: deviceWidths[device],
            maxWidth: "100%",
            transition: "width 0.3s ease",
          }}
        />
      </div>
    </div>
  );
}
