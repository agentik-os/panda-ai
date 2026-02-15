export const DEFAULT_MODEL = "claude-sonnet-4-5";
export const DEFAULT_TEMPERATURE = 0.7;
export const DEFAULT_MAX_TOKENS = 4096;

export const MODEL_COSTS = {
  "claude-opus-4": {
    input: 0.015,
    output: 0.075,
  },
  "claude-sonnet-4-5": {
    input: 0.003,
    output: 0.015,
  },
  "claude-haiku-4-5": {
    input: 0.001,
    output: 0.005,
  },
  "gpt-4o": {
    input: 0.005,
    output: 0.015,
  },
  "gpt-4o-mini": {
    input: 0.00015,
    output: 0.0006,
  },
} as const;

export const COMPLEXITY_THRESHOLDS = {
  SIMPLE: 30,
  MEDIUM: 60,
  COMPLEX: 100,
} as const;

export const MEMORY_RETENTION = {
  "short-term": 1000 * 60 * 10, // 10 minutes
  session: 1000 * 60 * 60 * 24, // 24 hours
  "long-term": Infinity,
  structured: Infinity,
  shared: Infinity,
} as const;
