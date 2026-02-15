export type SkillType = "builtin" | "marketplace" | "local" | "mcp";

export interface Skill {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  tags: string[];
  entrypoint: string;
  permissions: string[];
  type: SkillType;
  path?: string;
  mcpServer?: string;
  installedAt?: Date;
  config?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface SkillExecution {
  skillId: string;
  agentId: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
  status: "running" | "completed" | "failed";
}
