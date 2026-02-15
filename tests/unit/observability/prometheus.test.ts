import { describe, it, expect, beforeEach } from "vitest";
import {
  Counter,
  Gauge,
  Histogram,
  metrics,
  formatPrometheusMetrics,
  getMetricsJSON,
  resetAllMetrics,
  recordAgentExecution,
  recordMessageProcessed,
  updateSystemMetrics,
} from "../../../packages/runtime/src/observability/prometheus";

describe("Prometheus Metrics", () => {
  beforeEach(() => {
    resetAllMetrics();
  });

  describe("Counter", () => {
    it("should increment by 1 by default", () => {
      const counter = new Counter("test_counter", "Test counter");
      counter.inc();
      expect(counter.get()).toBe(1);
    });

    it("should increment by custom value", () => {
      const counter = new Counter("test_counter", "Test counter");
      counter.inc({}, 5);
      expect(counter.get()).toBe(5);
    });

    it("should track separate label combinations", () => {
      const counter = new Counter("test_counter", "Test counter");
      counter.inc({ method: "GET" }, 3);
      counter.inc({ method: "POST" }, 7);
      expect(counter.get({ method: "GET" })).toBe(3);
      expect(counter.get({ method: "POST" })).toBe(7);
    });

    it("should collect all label combinations", () => {
      const counter = new Counter("test_counter", "Test counter");
      counter.inc({ method: "GET" }, 3);
      counter.inc({ method: "POST" }, 7);
      const entries = counter.collect();
      expect(entries.length).toBe(2);
      expect(entries.every((e) => e.type === "counter")).toBe(true);
    });

    it("should reset to zero", () => {
      const counter = new Counter("test_counter", "Test counter");
      counter.inc({}, 10);
      counter.reset();
      expect(counter.get()).toBe(0);
    });
  });

  describe("Gauge", () => {
    it("should set a value", () => {
      const gauge = new Gauge("test_gauge", "Test gauge");
      gauge.set(42);
      expect(gauge.get()).toBe(42);
    });

    it("should set value with labels", () => {
      const gauge = new Gauge("test_gauge", "Test gauge");
      gauge.set({ env: "prod" }, 100);
      expect(gauge.get({ env: "prod" })).toBe(100);
    });

    it("should increment and decrement", () => {
      const gauge = new Gauge("test_gauge", "Test gauge");
      gauge.inc({}, 5);
      gauge.inc({}, 3);
      gauge.dec({}, 2);
      expect(gauge.get()).toBe(6);
    });
  });

  describe("Histogram", () => {
    it("should observe values and track buckets", () => {
      const histogram = new Histogram("test_hist", "Test histogram", [1, 5, 10]);
      histogram.observe(0.5);
      histogram.observe(3);
      histogram.observe(7);

      const entries = histogram.collect();
      expect(entries.length).toBe(1);
      expect(entries[0].count).toBe(3);
      expect(entries[0].sum).toBeCloseTo(10.5);
      expect(entries[0].buckets?.length).toBe(3);
      // 0.5 <= 1
      expect(entries[0].buckets?.[0].count).toBe(1);
      // 0.5 <= 5, 3 <= 5
      expect(entries[0].buckets?.[1].count).toBe(2);
      // all <= 10
      expect(entries[0].buckets?.[2].count).toBe(3);
    });

    it("should track labels separately", () => {
      const histogram = new Histogram("test_hist", "Test histogram", [1, 5]);
      histogram.observe({ model: "claude" }, 0.5);
      histogram.observe({ model: "gpt" }, 3);

      const entries = histogram.collect();
      expect(entries.length).toBe(2);
    });
  });

  describe("Agentik OS Metrics", () => {
    it("should record agent executions", () => {
      recordAgentExecution({
        agentId: "agent-1",
        model: "claude",
        durationMs: 1500,
        costUsd: 0.05,
        success: true,
      });

      expect(
        metrics.agentExecutionTotal.get({ agent_id: "agent-1", model: "claude" }),
      ).toBe(1);
      expect(
        metrics.agentExecutionErrors.get({ agent_id: "agent-1", model: "claude" }),
      ).toBe(0);
    });

    it("should record failed executions", () => {
      recordAgentExecution({
        agentId: "agent-1",
        model: "claude",
        durationMs: 500,
        costUsd: 0.01,
        success: false,
      });

      expect(
        metrics.agentExecutionErrors.get({ agent_id: "agent-1", model: "claude" }),
      ).toBe(1);
    });

    it("should record message processing", () => {
      recordMessageProcessed({
        channel: "telegram",
        agentId: "agent-1",
        durationMs: 200,
      });

      expect(
        metrics.messagesProcessed.get({ channel: "telegram", agent_id: "agent-1" }),
      ).toBe(1);
      expect(metrics.channelMessagesTotal.get({ channel: "telegram" })).toBe(1);
    });

    it("should update system metrics", () => {
      updateSystemMetrics({ activeAgents: 5 });
      expect(metrics.agentsActive.get()).toBe(5);
    });
  });

  describe("formatPrometheusMetrics", () => {
    it("should produce valid prometheus text format", () => {
      metrics.agentExecutionTotal.inc({ agent_id: "a1", model: "claude" }, 42);
      metrics.agentsActive.set(3);

      const output = formatPrometheusMetrics();
      expect(output).toContain("# HELP agent_execution_total");
      expect(output).toContain("# TYPE agent_execution_total counter");
      expect(output).toContain("agent_execution_total");
      expect(output).toContain("agents_active_total");
    });
  });

  describe("getMetricsJSON", () => {
    it("should return structured JSON", () => {
      metrics.agentExecutionTotal.inc({}, 10);
      const json = getMetricsJSON();
      expect(json).toHaveProperty("agentExecutionTotal");
      expect(json.agentExecutionTotal[0].value).toBe(10);
    });
  });
});
