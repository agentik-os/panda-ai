/**
 * Sentry Error Tracking for Agentik OS
 *
 * Lightweight Sentry integration that captures errors, breadcrumbs,
 * and context for agent execution failures.
 */

export interface SentryEvent {
  id: string;
  timestamp: string;
  level: "fatal" | "error" | "warning" | "info" | "debug";
  message: string;
  exception?: {
    type: string;
    value: string;
    stacktrace?: string;
  };
  tags: Record<string, string>;
  extra: Record<string, unknown>;
  breadcrumbs: Breadcrumb[];
  environment: string;
  release?: string;
}

export interface Breadcrumb {
  timestamp: string;
  category: string;
  message: string;
  level: "fatal" | "error" | "warning" | "info" | "debug";
  data?: Record<string, unknown>;
}

export interface SentryConfig {
  dsn?: string;
  environment: string;
  release?: string;
  maxBreadcrumbs?: number;
  maxEvents?: number;
  beforeSend?: (event: SentryEvent) => SentryEvent | null;
  sampleRate?: number;
}

// PII patterns to filter from error reports
const PII_PATTERNS = [
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // emails
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, // phone numbers
  /\bsk-[a-zA-Z0-9]{20,}\b/g, // API keys (sk-...)
  /\bghp_[a-zA-Z0-9]{36}\b/g, // GitHub tokens
  /\bBearer\s+[a-zA-Z0-9._-]+/g, // Bearer tokens
  /\bpassword\s*[=:]\s*\S+/gi, // passwords in logs
  /\b(?:\d{4}[-\s]?){3}\d{4}\b/g, // credit card numbers
];

function sanitizeString(str: string): string {
  let sanitized = str;
  for (const pattern of PII_PATTERNS) {
    sanitized = sanitized.replace(pattern, "[REDACTED]");
  }
  return sanitized;
}

function sanitizeObject(
  obj: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (
      lowerKey.includes("password") ||
      lowerKey.includes("secret") ||
      lowerKey.includes("token") ||
      lowerKey.includes("api_key") ||
      lowerKey.includes("apikey") ||
      lowerKey.includes("authorization")
    ) {
      result[key] = "[REDACTED]";
    } else if (typeof value === "string") {
      result[key] = sanitizeString(value);
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      result[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result;
}

function generateEventId(): string {
  const chars = "0123456789abcdef";
  let id = "";
  for (let i = 0; i < 32; i++) {
    id += chars[Math.floor(Math.random() * 16)];
  }
  return id;
}

class SentryTracker {
  private config: SentryConfig;
  private breadcrumbs: Breadcrumb[] = [];
  private events: SentryEvent[] = [];
  private tags: Record<string, string> = {};
  private initialized = false;

  constructor() {
    this.config = {
      environment: "development",
      maxBreadcrumbs: 100,
      maxEvents: 1000,
      sampleRate: 1.0,
    };
  }

  init(config: SentryConfig): void {
    this.config = {
      ...this.config,
      ...config,
    };
    this.initialized = true;
    this.addBreadcrumb({
      category: "sentry",
      message: "Sentry initialized",
      level: "info",
    });
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  setTag(key: string, value: string): void {
    this.tags[key] = value;
  }

  setTags(tags: Record<string, string>): void {
    Object.assign(this.tags, tags);
  }

  addBreadcrumb(breadcrumb: Omit<Breadcrumb, "timestamp">): void {
    const maxCrumbs = this.config.maxBreadcrumbs ?? 100;

    this.breadcrumbs.push({
      ...breadcrumb,
      timestamp: new Date().toISOString(),
    });

    if (this.breadcrumbs.length > maxCrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-maxCrumbs);
    }
  }

  captureException(
    error: Error | string,
    context?: {
      tags?: Record<string, string>;
      extra?: Record<string, unknown>;
      level?: SentryEvent["level"];
    },
  ): string {
    // Sample rate check
    if (Math.random() > (this.config.sampleRate ?? 1.0)) {
      return "";
    }

    const err = typeof error === "string" ? new Error(error) : error;
    const eventId = generateEventId();

    const event: SentryEvent = {
      id: eventId,
      timestamp: new Date().toISOString(),
      level: context?.level ?? "error",
      message: sanitizeString(err.message),
      exception: {
        type: err.constructor.name,
        value: sanitizeString(err.message),
        stacktrace: err.stack ? sanitizeString(err.stack) : undefined,
      },
      tags: {
        ...this.tags,
        ...sanitizeObject(context?.tags ?? {}) as Record<string, string>,
      },
      extra: sanitizeObject(context?.extra ?? {}),
      breadcrumbs: [...this.breadcrumbs],
      environment: this.config.environment,
      release: this.config.release,
    };

    // Apply beforeSend filter
    const filteredEvent = this.config.beforeSend
      ? this.config.beforeSend(event)
      : event;

    if (filteredEvent) {
      this.storeEvent(filteredEvent);
    }

    return eventId;
  }

  captureMessage(
    message: string,
    level: SentryEvent["level"] = "info",
    extra?: Record<string, unknown>,
  ): string {
    if (Math.random() > (this.config.sampleRate ?? 1.0)) {
      return "";
    }

    const eventId = generateEventId();

    const event: SentryEvent = {
      id: eventId,
      timestamp: new Date().toISOString(),
      level,
      message: sanitizeString(message),
      tags: { ...this.tags },
      extra: sanitizeObject(extra ?? {}),
      breadcrumbs: [...this.breadcrumbs],
      environment: this.config.environment,
      release: this.config.release,
    };

    const filteredEvent = this.config.beforeSend
      ? this.config.beforeSend(event)
      : event;

    if (filteredEvent) {
      this.storeEvent(filteredEvent);
    }

    return eventId;
  }

  /**
   * Wrap an async function with error tracking
   */
  async withScope<T>(
    scopeTags: Record<string, string>,
    fn: () => Promise<T>,
  ): Promise<T> {
    const previousTags = { ...this.tags };
    this.setTags(scopeTags);

    try {
      return await fn();
    } catch (error) {
      this.captureException(error instanceof Error ? error : new Error(String(error)), {
        tags: scopeTags,
      });
      throw error;
    } finally {
      this.tags = previousTags;
    }
  }

  /**
   * Get recent errors for the dashboard
   */
  getRecentErrors(limit = 50): SentryEvent[] {
    return this.events
      .filter((e) => e.level === "error" || e.level === "fatal")
      .slice(-limit)
      .reverse();
  }

  /**
   * Get all events (for the dashboard)
   */
  getEvents(options?: {
    level?: SentryEvent["level"];
    limit?: number;
    since?: string;
  }): SentryEvent[] {
    let filtered = [...this.events];

    if (options?.level) {
      filtered = filtered.filter((e) => e.level === options.level);
    }

    if (options?.since) {
      const sinceDate = new Date(options.since).getTime();
      filtered = filtered.filter(
        (e) => new Date(e.timestamp).getTime() >= sinceDate,
      );
    }

    const limit = options?.limit ?? 100;
    return filtered.slice(-limit).reverse();
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    total: number;
    byLevel: Record<string, number>;
    byType: Record<string, number>;
    recentRate: number;
  } {
    const byLevel: Record<string, number> = {};
    const byType: Record<string, number> = {};

    for (const event of this.events) {
      byLevel[event.level] = (byLevel[event.level] ?? 0) + 1;
      if (event.exception) {
        byType[event.exception.type] =
          (byType[event.exception.type] ?? 0) + 1;
      }
    }

    // Calculate error rate (errors per minute in last 5 minutes)
    const fiveMinAgo = Date.now() - 5 * 60 * 1000;
    const recentErrors = this.events.filter(
      (e) =>
        (e.level === "error" || e.level === "fatal") &&
        new Date(e.timestamp).getTime() >= fiveMinAgo,
    );
    const recentRate = recentErrors.length / 5;

    return {
      total: this.events.length,
      byLevel,
      byType,
      recentRate,
    };
  }

  /**
   * Clear all events (for testing)
   */
  clear(): void {
    this.events = [];
    this.breadcrumbs = [];
    this.tags = {};
  }

  private storeEvent(event: SentryEvent): void {
    const maxEvents = this.config.maxEvents ?? 1000;
    this.events.push(event);

    if (this.events.length > maxEvents) {
      this.events = this.events.slice(-maxEvents);
    }
  }
}

// Singleton instance
export const sentry = new SentryTracker();

/**
 * Convenience: capture an agent execution error
 */
export function captureAgentError(
  error: Error,
  agentId: string,
  context?: Record<string, unknown>,
): string {
  return sentry.captureException(error, {
    tags: { agent_id: agentId, source: "agent_runtime" },
    extra: context ?? {},
    level: "error",
  });
}

/**
 * Convenience: capture a channel error
 */
export function captureChannelError(
  error: Error,
  channel: string,
  context?: Record<string, unknown>,
): string {
  return sentry.captureException(error, {
    tags: { channel, source: "channel" },
    extra: context ?? {},
    level: "error",
  });
}

export { SentryTracker };
