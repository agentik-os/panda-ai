import type { Message } from "@agentik-os/shared";
import { calculateComplexity } from "../router/complexity";
import { selectModel, type ModelPreferences, type ModelSelection } from "../router/selector";

export interface ModelSelectConfig {
  preferences?: ModelPreferences;
}

export interface ModelSelectResult {
  selection: ModelSelection;
  complexity: number;
}

export async function selectModelForMessage(
  message: Message,
  config: ModelSelectConfig = {}
): Promise<ModelSelectResult> {
  // 1. Calculate message complexity
  const complexityScore = calculateComplexity(message);

  // 2. Select appropriate model
  const selection = selectModel(complexityScore, config.preferences);

  return {
    selection,
    complexity: complexityScore.score,
  };
}
