/**
 * Model Router Benchmarks
 * Target: <100ms model selection
 */

import { bench, describe } from "vitest";
import { ComplexityAnalyzer } from "../../../src/router/complexity";
import { ModelSelector } from "../../../src/router/selector";
import type { Message } from "@agentik-os/shared";

describe("Router Benchmarks", () => {
  const simpleMessage: Message = {
    from: "user",
    content: "Hello",
    channel: "cli",
    timestamp: Date.now(),
    agentId: "test",
    normalized: true,
  };

  const complexMessage: Message = {
    from: "user",
    content:
      "Analyze this entire codebase, refactor the architecture, write comprehensive tests, and deploy to production",
    channel: "cli",
    timestamp: Date.now(),
    agentId: "test",
    normalized: true,
  };

  const analyzer = new ComplexityAnalyzer();
  const selector = new ModelSelector();

  bench("analyze complexity (simple)", () => {
    analyzer.analyze(simpleMessage.content);
  });

  bench("analyze complexity (complex)", () => {
    analyzer.analyze(complexMessage.content);
  });

  bench("select model (simple)", () => {
    selector.select(simpleMessage, ["anthropic", "openai"]);
  });

  bench("select model (complex)", () => {
    selector.select(complexMessage, ["anthropic", "openai", "google"]);
  });

  bench("complexity analysis batch (1000 messages)", () => {
    for (let i = 0; i < 1000; i++) {
      analyzer.analyze(`Message ${i}: analyze this code`);
    }
  });
});
