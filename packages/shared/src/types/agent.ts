export interface Agent {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
  active: boolean;
  channels: string[];
  skills: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentConfig {
  name: string;
  description: string;
  systemPrompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  channels?: string[];
  skills?: string[];
}
