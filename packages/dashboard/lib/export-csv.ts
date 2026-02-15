/**
 * CSV Export Utilities
 *
 * Professional CSV export for cost analytics using papaparse
 */

import Papa from "papaparse";

/**
 * Download a file to the user's computer
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format date for CSV export
 */
function formatDate(timestamp: number): string {
  return new Date(timestamp).toISOString().split("T")[0]!; // YYYY-MM-DD
}

/**
 * Format datetime for CSV export
 */
function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toISOString(); // Full ISO datetime
}

/**
 * Export agent-level cost data to CSV
 */
export function exportAgentCostCSV(
  costsByAgent: Array<{
    agentId: string;
    totalCost: number;
    totalTokens: number;
    requestCount: number;
  }>,
  agents: Array<{ _id: string; name: string }>,
  filename?: string
) {
  const agentMap = new Map(agents.map((a) => [a._id, a.name]));

  const data = costsByAgent.map((item) => ({
    "Agent Name": agentMap.get(item.agentId) || item.agentId,
    "Agent ID": item.agentId,
    "Total Cost (USD)": item.totalCost.toFixed(4),
    "Total Tokens": item.totalTokens,
    "Request Count": item.requestCount,
    "Avg Cost per Request (USD)": (item.totalCost / item.requestCount).toFixed(4),
    "Cost per 1M Tokens (USD)": ((item.totalCost / item.totalTokens) * 1000000).toFixed(2),
  }));

  const csv = Papa.unparse(data);
  const defaultFilename = `agentik-agent-costs-${formatDate(Date.now())}.csv`;
  downloadFile(csv, filename || defaultFilename, "text/csv;charset=utf-8;");
}

/**
 * Export model-level cost data to CSV
 */
export function exportModelCostCSV(
  costsByModel: Array<{
    model: string;
    provider: string;
    totalCost: number;
    totalTokens: number;
    requestCount: number;
    avgCostPerRequest: number;
  }>,
  filename?: string
) {
  const data = costsByModel.map((item) => ({
    Model: item.model,
    Provider: item.provider,
    "Total Cost (USD)": item.totalCost.toFixed(4),
    "Total Tokens": item.totalTokens,
    "Request Count": item.requestCount,
    "Avg Cost per Request (USD)": item.avgCostPerRequest.toFixed(4),
    "Cost per 1M Tokens (USD)": ((item.totalCost / item.totalTokens) * 1000000).toFixed(2),
  }));

  const csv = Papa.unparse(data);
  const defaultFilename = `agentik-model-costs-${formatDate(Date.now())}.csv`;
  downloadFile(csv, filename || defaultFilename, "text/csv;charset=utf-8;");
}

/**
 * Export time-series cost data to CSV
 */
export function exportCostHistoryCSV(
  costHistory: Array<{
    timestamp: number;
    totalCost: number;
    totalTokens: number;
    requestCount: number;
  }>,
  filename?: string
) {
  const data = costHistory.map((item) => ({
    Date: formatDate(item.timestamp),
    Time: formatDateTime(item.timestamp),
    "Total Cost (USD)": item.totalCost.toFixed(4),
    "Total Tokens": item.totalTokens,
    "Request Count": item.requestCount,
    "Avg Cost per Request (USD)":
      item.requestCount > 0 ? (item.totalCost / item.requestCount).toFixed(4) : "0.0000",
  }));

  const csv = Papa.unparse(data);
  const defaultFilename = `agentik-cost-history-${formatDate(Date.now())}.csv`;
  downloadFile(csv, filename || defaultFilename, "text/csv;charset=utf-8;");
}

/**
 * Export complete cost analytics to CSV (all data combined)
 */
export function exportCompleteCostCSV(
  costsByAgent: Array<{
    agentId: string;
    totalCost: number;
    totalTokens: number;
    requestCount: number;
  }>,
  agents: Array<{ _id: string; name: string; model: string }>,
  filename?: string
) {
  const agentMap = new Map(
    agents.map((a) => [a._id, { name: a.name, model: a.model }])
  );

  const data = costsByAgent.map((item) => {
    const agent = agentMap.get(item.agentId);
    return {
      "Agent Name": agent?.name || item.agentId,
      "Agent ID": item.agentId,
      Model: agent?.model || "Unknown",
      "Total Cost (USD)": item.totalCost.toFixed(4),
      "Total Tokens": item.totalTokens,
      "Request Count": item.requestCount,
      "Avg Cost per Request (USD)": (item.totalCost / item.requestCount).toFixed(4),
      "Cost per 1M Tokens (USD)": ((item.totalCost / item.totalTokens) * 1000000).toFixed(2),
      Efficiency:
        (item.totalCost / item.totalTokens) * 1000000 < 10
          ? "Excellent"
          : (item.totalCost / item.totalTokens) * 1000000 < 100
            ? "Good"
            : "Needs Optimization",
    };
  });

  const csv = Papa.unparse(data);
  const defaultFilename = `agentik-costs-complete-${formatDate(Date.now())}.csv`;
  downloadFile(csv, filename || defaultFilename, "text/csv;charset=utf-8;");
}
