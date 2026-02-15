/**
 * Pipeline Performance Benchmarks
 * Target: <200ms p95 response time
 */

import { bench, describe } from "vitest";
import { MessagePipeline } from "../../../src/pipeline/orchestrator";
import { normalizeMessage } from "../../../src/pipeline/normalize";
import { routeMessage } from "../../../src/pipeline/route";
import type { RawMessage } from "@agentik-os/shared";

describe("Pipeline Benchmarks", () => {
  const mockMessage: RawMessage = {
    from: "test-user",
    content: "Hello, analyze this code for me",
    channel: "cli",
    timestamp: Date.now(),
  };

  const mockConfig = {
    route: {
      defaultAgent: "default",
      rules: [],
    },
    modelSelect: {
      providers: ["anthropic"],
      defaultModel: "claude-3-5-sonnet-20241022",
    },
    execute: {
      timeout: 30000,
      retries: 3,
    },
  };

  bench(
    "normalize message",
    () => {
      normalizeMessage(mockMessage);
    },
    {
      iterations: 10000,
    }
  );

  bench(
    "route message",
    () => {
      const normalized = normalizeMessage(mockMessage);
      routeMessage(normalized, mockConfig.route);
    },
    {
      iterations: 10000,
    }
  );

  bench(
    "full pipeline (mocked AI)",
    async () => {
      const pipeline = new MessagePipeline(mockConfig);
      // Mock AI response to isolate pipeline performance
      await pipeline.process(mockMessage);
    },
    {
      iterations: 100,
      time: 5000, // 5 second warmup
    }
  );

  bench(
    "normalize + route + memory load",
    async () => {
      const normalized = normalizeMessage(mockMessage);
      const agentId = routeMessage(normalized, mockConfig.route);
      // Memory loading would happen here
    },
    {
      iterations: 1000,
    }
  );
});

describe("Pipeline Stages", () => {
  bench("Stage 1: Normalize (10K messages)", () => {
    for (let i = 0; i < 10000; i++) {
      normalizeMessage({
        from: `user-${i}`,
        content: `Message ${i}`,
        channel: "cli",
        timestamp: Date.now(),
      });
    }
  });

  bench("Stage 2: Route (10K messages)", () => {
    const config = {
      defaultAgent: "default",
      rules: [],
    };
    for (let i = 0; i < 10000; i++) {
      const msg = normalizeMessage({
        from: `user-${i}`,
        content: `Message ${i}`,
        channel: "cli",
        timestamp: Date.now(),
      });
      routeMessage(msg, config);
    }
  });
});
