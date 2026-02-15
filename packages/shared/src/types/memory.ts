export type MemoryTier = "short-term" | "session" | "long-term" | "structured" | "shared";

export interface Memory {
  id: string;
  agentId: string;
  userId?: string;
  tier: MemoryTier;
  content: string;
  embedding?: number[];
  importance: number; // 0-100
  accessCount: number;
  lastAccessed: Date;
  createdAt: Date;
  expiresAt?: Date;
  metadata: Record<string, unknown>;
}

export interface MemoryQuery {
  query: string;
  tier?: MemoryTier;
  limit?: number;
  minImportance?: number;
}
