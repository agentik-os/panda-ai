export interface CostEvent {
  id: string;
  agentId: string;
  userId?: string;
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number; // USD
  timestamp: Date;
  metadata: Record<string, unknown>;
}

export interface Conversation {
  id: string;
  agentId: string;
  userId: string;
  messages: {
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}
