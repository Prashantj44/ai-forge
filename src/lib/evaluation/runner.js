/**
 * Evaluation Runner
 * 
 * Runs all test prompts through the pipeline and collects metrics.
 */

import { runPipeline } from "../pipeline/index.js";
import { testDataset } from "./dataset.js";

/**
 * Run evaluation on a subset or all prompts
 * @param {Array} prompts - Array of test prompt objects (defaults to full dataset)
 * @param {function} onProgress - Progress callback
 * @returns {Promise<object>} Evaluation results
 */
export async function runEvaluation(prompts = testDataset, onProgress = () => {}) {
  const results = [];
  const startTime = Date.now();

  for (let i = 0; i < prompts.length; i++) {
    const testCase = prompts[i];
    onProgress({
      current: i + 1,
      total: prompts.length,
      prompt: testCase.prompt.substring(0, 50) + "...",
      status: "running",
    });

    const caseStart = Date.now();

    try {
      const result = await runPipeline(testCase.prompt);

      results.push({
        id: testCase.id,
        category: testCase.category,
        prompt: testCase.prompt,
        status: result.status,
        success: result.status === "success",
        latency: Date.now() - caseStart,
        totalRepairs: result.metrics?.totalRepairs || 0,
        validationScore: result.metrics?.validationScore || 0,
        totalTokens: result.metrics?.totalTokens || 0,
        totalCost: result.metrics?.totalCost || 0,
        stageCount: result.stages?.length || 0,
        error: result.error || null,
      });
    } catch (error) {
      results.push({
        id: testCase.id,
        category: testCase.category,
        prompt: testCase.prompt,
        status: "error",
        success: false,
        latency: Date.now() - caseStart,
        totalRepairs: 0,
        validationScore: 0,
        totalTokens: 0,
        totalCost: 0,
        stageCount: 0,
        error: error.message,
      });
    }

    onProgress({
      current: i + 1,
      total: prompts.length,
      prompt: testCase.prompt.substring(0, 50) + "...",
      status: "complete",
    });
  }

  // Aggregate metrics
  const totalLatency = Date.now() - startTime;
  const successCount = results.filter((r) => r.success).length;
  const failureCount = results.filter((r) => !r.success).length;
  const avgLatency = results.reduce((sum, r) => sum + r.latency, 0) / results.length;
  const avgRepairs = results.reduce((sum, r) => sum + r.totalRepairs, 0) / results.length;
  const avgValidationScore = results.filter((r) => r.success).reduce((sum, r) => sum + r.validationScore, 0) / (successCount || 1);
  const totalCost = results.reduce((sum, r) => sum + r.totalCost, 0);
  const totalTokens = results.reduce((sum, r) => sum + r.totalTokens, 0);

  // Failure type analysis
  const failureTypes = {};
  results.filter((r) => !r.success).forEach((r) => {
    const type = r.error?.includes("timeout") ? "timeout"
      : r.error?.includes("JSON") ? "json_parse"
      : r.error?.includes("schema") ? "schema_violation"
      : r.status === "clarification_needed" ? "clarification_needed"
      : "other";
    failureTypes[type] = (failureTypes[type] || 0) + 1;
  });

  return {
    summary: {
      totalPrompts: prompts.length,
      successCount,
      failureCount,
      successRate: `${((successCount / prompts.length) * 100).toFixed(1)}%`,
      totalLatency,
      avgLatency: Math.round(avgLatency),
      avgRepairsPerRequest: parseFloat(avgRepairs.toFixed(2)),
      avgValidationScore: parseFloat(avgValidationScore.toFixed(1)),
      totalCost: parseFloat(totalCost.toFixed(6)),
      totalTokens,
      failureTypes,
    },
    results,
  };
}
