/**
 * Memory System Benchmarks
 * Target: <50ms memory operations
 */

import { bench, describe } from "vitest";
import { ShortTermMemory } from "../../../src/memory/short-term";
import { SessionMemory } from "../../../src/memory/session";

describe("Memory Benchmarks", () => {
  const shortTerm = new ShortTermMemory();
  const session = new SessionMemory();

  bench("short-term: add 100 messages", () => {
    const memory = new ShortTermMemory();
    for (let i = 0; i < 100; i++) {
      memory.add({
        role: "user",
        content: `Message ${i}`,
        timestamp: Date.now(),
      });
    }
  });

  bench("short-term: get last 20 messages", () => {
    const memory = new ShortTermMemory();
    for (let i = 0; i < 100; i++) {
      memory.add({
        role: "user",
        content: `Message ${i}`,
        timestamp: Date.now(),
      });
    }
    memory.getLast(20);
  });

  bench("short-term: clear memory", () => {
    const memory = new ShortTermMemory();
    for (let i = 0; i < 100; i++) {
      memory.add({
        role: "user",
        content: `Message ${i}`,
        timestamp: Date.now(),
      });
    }
    memory.clear();
  });

  bench("session: create + get 100 sessions", () => {
    const sessionMem = new SessionMemory();
    for (let i = 0; i < 100; i++) {
      sessionMem.create(`user-${i}`, `agent-${i % 10}`);
      sessionMem.get(`user-${i}`);
    }
  });

  bench("session: update metadata 1000 times", () => {
    const sessionMem = new SessionMemory();
    const sessionId = sessionMem.create("user-1", "agent-1");
    for (let i = 0; i < 1000; i++) {
      sessionMem.update(sessionId, { metadata: { count: i } });
    }
  });
});
