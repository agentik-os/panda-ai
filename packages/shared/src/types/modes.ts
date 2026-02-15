/**
 * OS Modes Configuration
 * Step-072: OS Modes (Focus/Creative/Research)
 */

export type AgentMode = "focus" | "creative" | "research" | "balanced";

export interface ModeConfig {
  id: AgentMode;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  color: string; // Tailwind color class
  systemPromptModifier: string;
  temperature: number;
  maxTokens: number;
  features: {
    verbosity: "minimal" | "normal" | "detailed";
    citations: boolean;
    exploration: boolean;
    strictness: "strict" | "balanced" | "flexible";
  };
}

/**
 * Mode Configurations
 */
export const MODE_CONFIGS: Record<AgentMode, ModeConfig> = {
  focus: {
    id: "focus",
    name: "Focus Mode",
    description: "Minimal distractions, direct answers, task-oriented",
    icon: "target",
    color: "blue",
    systemPromptModifier: `
You are in FOCUS MODE. Prioritize efficiency and clarity:
- Give direct, concise answers
- Minimize tangents and elaboration
- Focus on actionable steps
- Use bullet points when possible
- Avoid unnecessary explanations unless asked
    `.trim(),
    temperature: 0.3,
    maxTokens: 1000,
    features: {
      verbosity: "minimal",
      citations: false,
      exploration: false,
      strictness: "strict",
    },
  },

  creative: {
    id: "creative",
    name: "Creative Mode",
    description: "Exploratory thinking, brainstorming, multiple perspectives",
    icon: "sparkles",
    color: "purple",
    systemPromptModifier: `
You are in CREATIVE MODE. Embrace exploration and innovation:
- Generate multiple ideas and perspectives
- Think outside the box
- Explore unconventional solutions
- Use metaphors and analogies
- Encourage brainstorming and iteration
- Be playful and imaginative
    `.trim(),
    temperature: 0.9,
    maxTokens: 2000,
    features: {
      verbosity: "detailed",
      citations: false,
      exploration: true,
      strictness: "flexible",
    },
  },

  research: {
    id: "research",
    name: "Research Mode",
    description: "Deep analysis, citations, thorough explanations",
    icon: "book-open",
    color: "green",
    systemPromptModifier: `
You are in RESEARCH MODE. Prioritize accuracy and depth:
- Provide thorough, well-reasoned analysis
- Include citations and sources when possible
- Explain underlying concepts and context
- Consider multiple viewpoints and evidence
- Be precise with terminology
- Acknowledge limitations and uncertainties
    `.trim(),
    temperature: 0.5,
    maxTokens: 3000,
    features: {
      verbosity: "detailed",
      citations: true,
      exploration: true,
      strictness: "balanced",
    },
  },

  balanced: {
    id: "balanced",
    name: "Balanced Mode",
    description: "General-purpose, adaptive responses",
    icon: "scale",
    color: "gray",
    systemPromptModifier: `
You are in BALANCED MODE. Adapt to the user's needs:
- Adjust detail level based on the question
- Be helpful and thorough without being verbose
- Provide examples when appropriate
- Balance creativity with practicality
    `.trim(),
    temperature: 0.7,
    maxTokens: 1500,
    features: {
      verbosity: "normal",
      citations: false,
      exploration: false,
      strictness: "balanced",
    },
  },
};

/**
 * Get mode configuration by ID
 */
export function getModeConfig(mode: AgentMode = "balanced"): ModeConfig {
  return MODE_CONFIGS[mode];
}

/**
 * Apply mode configuration to system prompt
 */
export function applyModeToSystemPrompt(
  basePrompt: string,
  mode: AgentMode = "balanced",
): string {
  const config = getModeConfig(mode);

  return `${basePrompt}

---
${config.systemPromptModifier}`;
}
