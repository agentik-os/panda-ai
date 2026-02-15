export function calculateCost(
  promptTokens: number,
  completionTokens: number,
  inputCostPer1M: number,
  outputCostPer1M: number
): number {
  const promptCost = (promptTokens / 1_000_000) * inputCostPer1M;
  const completionCost = (completionTokens / 1_000_000) * outputCostPer1M;
  return promptCost + completionCost;
}

export function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `$${(cost * 100).toFixed(4)}¢`;
  }
  return `$${cost.toFixed(4)}`;
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}
