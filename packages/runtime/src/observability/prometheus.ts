/**
 * Prometheus Metrics Collection for Agentik OS
 *
 * Collects and exposes metrics for agent execution, messages,
 * costs, and system health in Prometheus format.
 */

export interface MetricLabels {
  [key: string]: string;
}

interface HistogramBucket {
  le: number;
  count: number;
}

interface MetricEntry {
  name: string;
  help: string;
  type: "counter" | "gauge" | "histogram";
  labels: MetricLabels;
  value: number;
  buckets?: HistogramBucket[];
  sum?: number;
  count?: number;
}

// Default histogram buckets (in seconds)
const DEFAULT_BUCKETS = [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30, 60];

class Counter {
  private values = new Map<string, number>();

  constructor(
    readonly name: string,
    readonly help: string,
  ) {}

  inc(labels: MetricLabels = {}, value = 1): void {
    const key = this.labelsKey(labels);
    this.values.set(key, (this.values.get(key) ?? 0) + value);
  }

  get(labels: MetricLabels = {}): number {
    return this.values.get(this.labelsKey(labels)) ?? 0;
  }

  reset(): void {
    this.values.clear();
  }

  collect(): MetricEntry[] {
    const entries: MetricEntry[] = [];
    for (const [key, value] of this.values) {
      entries.push({
        name: this.name,
        help: this.help,
        type: "counter",
        labels: this.parseLabelsKey(key),
        value,
      });
    }
    if (entries.length === 0) {
      entries.push({
        name: this.name,
        help: this.help,
        type: "counter",
        labels: {},
        value: 0,
      });
    }
    return entries;
  }

  private labelsKey(labels: MetricLabels): string {
    return Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(",");
  }

  private parseLabelsKey(key: string): MetricLabels {
    if (!key) return {};
    const labels: MetricLabels = {};
    for (const part of key.split(",")) {
      const [k, v] = part.split("=");
      if (k && v) labels[k] = v.replace(/"/g, "");
    }
    return labels;
  }
}

class Gauge {
  private values = new Map<string, number>();

  constructor(
    readonly name: string,
    readonly help: string,
  ) {}

  set(labels: MetricLabels, value: number): void;
  set(value: number): void;
  set(labelsOrValue: MetricLabels | number, maybeValue?: number): void {
    if (typeof labelsOrValue === "number") {
      this.values.set("", labelsOrValue);
    } else {
      this.values.set(this.labelsKey(labelsOrValue), maybeValue ?? 0);
    }
  }

  inc(labels: MetricLabels = {}, value = 1): void {
    const key = this.labelsKey(labels);
    this.values.set(key, (this.values.get(key) ?? 0) + value);
  }

  dec(labels: MetricLabels = {}, value = 1): void {
    const key = this.labelsKey(labels);
    this.values.set(key, (this.values.get(key) ?? 0) - value);
  }

  get(labels: MetricLabels = {}): number {
    return this.values.get(this.labelsKey(labels)) ?? 0;
  }

  reset(): void {
    this.values.clear();
  }

  collect(): MetricEntry[] {
    const entries: MetricEntry[] = [];
    for (const [key, value] of this.values) {
      entries.push({
        name: this.name,
        help: this.help,
        type: "gauge",
        labels: this.parseLabelsKey(key),
        value,
      });
    }
    if (entries.length === 0) {
      entries.push({
        name: this.name,
        help: this.help,
        type: "gauge",
        labels: {},
        value: 0,
      });
    }
    return entries;
  }

  private labelsKey(labels: MetricLabels): string {
    return Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(",");
  }

  private parseLabelsKey(key: string): MetricLabels {
    if (!key) return {};
    const labels: MetricLabels = {};
    for (const part of key.split(",")) {
      const [k, v] = part.split("=");
      if (k && v) labels[k] = v.replace(/"/g, "");
    }
    return labels;
  }
}

class Histogram {
  private observations = new Map<
    string,
    { sum: number; count: number; buckets: number[] }
  >();

  constructor(
    readonly name: string,
    readonly help: string,
    readonly buckets: number[] = DEFAULT_BUCKETS,
  ) {
    this.buckets = [...buckets].sort((a, b) => a - b);
  }

  observe(labels: MetricLabels, value: number): void;
  observe(value: number): void;
  observe(labelsOrValue: MetricLabels | number, maybeValue?: number): void {
    let key: string;
    let value: number;

    if (typeof labelsOrValue === "number") {
      key = "";
      value = labelsOrValue;
    } else {
      key = this.labelsKey(labelsOrValue);
      value = maybeValue ?? 0;
    }

    let obs = this.observations.get(key);
    if (!obs) {
      obs = { sum: 0, count: 0, buckets: new Array(this.buckets.length).fill(0) };
      this.observations.set(key, obs);
    }

    obs.sum += value;
    obs.count += 1;

    for (let i = 0; i < this.buckets.length; i++) {
      const bucket = this.buckets[i];
      if (bucket !== undefined && value <= bucket) {
        obs.buckets[i] = (obs.buckets[i] ?? 0) + 1;
      }
    }
  }

  reset(): void {
    this.observations.clear();
  }

  collect(): MetricEntry[] {
    const entries: MetricEntry[] = [];
    for (const [key, obs] of this.observations) {
      entries.push({
        name: this.name,
        help: this.help,
        type: "histogram",
        labels: this.parseLabelsKey(key),
        value: obs.sum,
        sum: obs.sum,
        count: obs.count,
        buckets: this.buckets.map((le, i) => ({
          le,
          count: obs.buckets[i] ?? 0,
        })),
      });
    }
    return entries;
  }

  private labelsKey(labels: MetricLabels): string {
    return Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(",");
  }

  private parseLabelsKey(key: string): MetricLabels {
    if (!key) return {};
    const labels: MetricLabels = {};
    for (const part of key.split(",")) {
      const [k, v] = part.split("=");
      if (k && v) labels[k] = v.replace(/"/g, "");
    }
    return labels;
  }
}

// --- Agentik OS Metrics Registry ---

export const metrics = {
  // Agent execution metrics
  agentExecutionDuration: new Histogram(
    "agent_execution_duration_seconds",
    "Duration of agent executions in seconds",
    [0.1, 0.5, 1, 2.5, 5, 10, 30, 60, 120],
  ),
  agentExecutionTotal: new Counter(
    "agent_execution_total",
    "Total number of agent executions",
  ),
  agentExecutionErrors: new Counter(
    "agent_execution_errors_total",
    "Total number of agent execution errors",
  ),

  // Message metrics
  messagesProcessed: new Counter(
    "messages_processed_total",
    "Total number of messages processed",
  ),
  messageProcessingDuration: new Histogram(
    "message_processing_duration_seconds",
    "Duration of message processing in seconds",
  ),

  // Cost metrics
  agentCostTotal: new Gauge(
    "agent_cost_total_usd",
    "Total cost of agent operations in USD",
  ),
  agentCostPerExecution: new Histogram(
    "agent_cost_per_execution_usd",
    "Cost per agent execution in USD",
    [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
  ),

  // System metrics
  agentsActive: new Gauge(
    "agents_active_total",
    "Number of currently active agents",
  ),
  memoryUsageBytes: new Gauge(
    "memory_usage_bytes",
    "Current memory usage in bytes",
  ),

  // Skill metrics
  skillExecutionTotal: new Counter(
    "skill_execution_total",
    "Total number of skill executions",
  ),
  skillExecutionDuration: new Histogram(
    "skill_execution_duration_seconds",
    "Duration of skill executions in seconds",
  ),

  // Channel metrics
  channelMessagesTotal: new Counter(
    "channel_messages_total",
    "Total messages by channel",
  ),

  // HTTP request metrics
  httpRequestDuration: new Histogram(
    "http_request_duration_seconds",
    "Duration of HTTP requests in seconds",
  ),
  httpRequestTotal: new Counter(
    "http_request_total",
    "Total number of HTTP requests",
  ),
} as const;

/**
 * Record an agent execution with all associated metrics
 */
export function recordAgentExecution(params: {
  agentId: string;
  model: string;
  durationMs: number;
  costUsd: number;
  success: boolean;
}): void {
  const { agentId, model, durationMs, costUsd, success } = params;
  const labels = { agent_id: agentId, model };
  const durationSec = durationMs / 1000;

  metrics.agentExecutionTotal.inc(labels);
  metrics.agentExecutionDuration.observe(labels, durationSec);
  metrics.agentCostPerExecution.observe(labels, costUsd);
  metrics.agentCostTotal.inc(labels, costUsd);

  if (!success) {
    metrics.agentExecutionErrors.inc(labels);
  }
}

/**
 * Record a message processed through a channel
 */
export function recordMessageProcessed(params: {
  channel: string;
  agentId: string;
  durationMs: number;
}): void {
  const { channel, agentId, durationMs } = params;
  const labels = { channel, agent_id: agentId };

  metrics.messagesProcessed.inc(labels);
  metrics.messageProcessingDuration.observe(labels, durationMs / 1000);
  metrics.channelMessagesTotal.inc({ channel });
}

/**
 * Update system-level gauges (call periodically)
 */
export function updateSystemMetrics(params: {
  activeAgents: number;
}): void {
  metrics.agentsActive.set(params.activeAgents);

  if (typeof process !== "undefined" && process.memoryUsage) {
    const mem = process.memoryUsage();
    metrics.memoryUsageBytes.set({ type: "rss" }, mem.rss);
    metrics.memoryUsageBytes.set({ type: "heap_used" }, mem.heapUsed);
    metrics.memoryUsageBytes.set({ type: "heap_total" }, mem.heapTotal);
  }
}

/**
 * Format all metrics as Prometheus text exposition format
 */
export function formatPrometheusMetrics(): string {
  const lines: string[] = [];

  const allMetrics = Object.values(metrics);
  for (const metric of allMetrics) {
    const entries = metric.collect();
    if (entries.length === 0) continue;

    const first = entries[0]!;
    lines.push(`# HELP ${first.name} ${first.help}`);
    lines.push(`# TYPE ${first.name} ${first.type}`);

    for (const entry of entries) {
      const labelStr = formatLabels(entry.labels);

      if (entry.type === "histogram" && entry.buckets) {
        for (const bucket of entry.buckets) {
          const bucketLabels = { ...entry.labels, le: String(bucket.le) };
          lines.push(
            `${entry.name}_bucket${formatLabels(bucketLabels)} ${bucket.count}`,
          );
        }
        const infLabels = { ...entry.labels, le: "+Inf" };
        lines.push(
          `${entry.name}_bucket${formatLabels(infLabels)} ${entry.count}`,
        );
        lines.push(`${entry.name}_sum${labelStr} ${entry.sum}`);
        lines.push(`${entry.name}_count${labelStr} ${entry.count}`);
      } else {
        lines.push(`${entry.name}${labelStr} ${entry.value}`);
      }
    }

    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Get metrics as structured JSON (for dashboard API)
 */
export function getMetricsJSON(): Record<string, MetricEntry[]> {
  const result: Record<string, MetricEntry[]> = {};

  for (const [key, metric] of Object.entries(metrics)) {
    result[key] = metric.collect();
  }

  return result;
}

/**
 * Reset all metrics (useful for testing)
 */
export function resetAllMetrics(): void {
  for (const metric of Object.values(metrics)) {
    metric.reset();
  }
}

function formatLabels(labels: MetricLabels): string {
  const entries = Object.entries(labels);
  if (entries.length === 0) return "";
  return `{${entries.map(([k, v]) => `${k}="${v}"`).join(",")}}`;
}

export { Counter, Gauge, Histogram };
export type { MetricEntry, HistogramBucket };
