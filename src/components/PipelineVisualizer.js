"use client";

const STAGES = [
  { id: 1, name: "Intent\nExtraction", icon: "🎯" },
  { id: 2, name: "System\nDesign", icon: "🏗️" },
  { id: 3, name: "Schema\nGeneration", icon: "📐" },
  { id: 4, name: "Refinement\n& Validation", icon: "✨" },
];

export default function PipelineVisualizer({ stages, currentStage }) {
  if (!stages && !currentStage) return null;

  const getStageStatus = (stageId) => {
    const stageData = stages?.find((s) => s.id === stageId);
    if (stageData) return stageData.status;
    if (currentStage === stageId) return "active";
    if (currentStage > stageId) return "complete";
    return "pending";
  };

  const getStageTime = (stageId) => {
    const stageData = stages?.find((s) => s.id === stageId);
    if (stageData?.latency) {
      return `${(stageData.latency / 1000).toFixed(1)}s`;
    }
    return null;
  };

  const getRepairCount = (stageId) => {
    const stageData = stages?.find((s) => s.id === stageId);
    return stageData?.repairCount || 0;
  };

  return (
    <div className="pipeline-section">
      <div className="pipeline-container">
        {STAGES.map((stage, index) => {
          const status = getStageStatus(stage.id);
          const time = getStageTime(stage.id);
          const repairs = getRepairCount(stage.id);

          return (
            <div className="pipeline-stage" key={stage.id}>
              {index > 0 && (
                <div
                  className={`stage-connector ${
                    status === "active" || status === "complete" ? "active" : ""
                  }`}
                />
              )}
              <div className={`stage-node ${status}`}>
                <span className="stage-icon">
                  {status === "complete" ? "✅" : status === "error" ? "❌" : stage.icon}
                </span>
                <span className="stage-name">{stage.name}</span>
                {time && <span className="stage-time">{time}</span>}
                {repairs > 0 && (
                  <span className="stage-time" style={{ color: "var(--accent-warning)" }}>
                    🔧 {repairs} repair{repairs > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
