import { describe, it, expect } from "vitest";
import { calculateComplexity } from "./complexity";
import type { Message } from "@agentik-os/shared";

const createMessage = (content: string, attachments?: unknown[]): Message => ({
  id: "msg_1",
  channel: "cli",
  channelMessageId: "test_1",
  userId: "user_1",
  agentId: "test-agent",
  content,
  attachments: attachments as Message["attachments"],
  metadata: {},
  timestamp: new Date(),
});

describe("calculateComplexity", () => {
  it("should score simple messages low", () => {
    const message = createMessage("Hello");
    const result = calculateComplexity(message);

    expect(result.score).toBeLessThan(30);
    expect(result.factors.hasCode).toBe(false);
  });

  it("should score code-related messages high", () => {
    const message = createMessage("Implement a function to sort arrays");
    const result = calculateComplexity(message);

    expect(result.score).toBeGreaterThan(50);
    expect(result.factors.keywords).toContain("implement");
  });

  it("should detect code blocks", () => {
    const message = createMessage("Here's some code:\n```ts\nfunction test() {}\n```");
    const result = calculateComplexity(message);

    expect(result.factors.hasCode).toBe(true);
    expect(result.score).toBeGreaterThan(50);
  });

  it("should consider message length", () => {
    const shortMessage = createMessage("Hi");
    const longMessage = createMessage("a".repeat(1000));

    const shortScore = calculateComplexity(shortMessage);
    const longScore = calculateComplexity(longMessage);

    expect(longScore.score).toBeGreaterThan(shortScore.score);
  });

  it("should account for attachments", () => {
    const withAttachment = createMessage("Check this file", [
      { id: "att_1", type: "file", url: "test.pdf" },
    ]);
    const withoutAttachment = createMessage("Check this file");

    const withScore = calculateComplexity(withAttachment);
    const withoutScore = calculateComplexity(withoutAttachment);

    expect(withScore.score).toBeGreaterThan(withoutScore.score);
    expect(withScore.factors.hasAttachments).toBe(true);
  });

  it("should cap score at 100", () => {
    const message = createMessage(
      "Implement refactor debug optimize architecture code " + "very ".repeat(200),
      [{ id: "att_1", type: "file", url: "test" }]
    );
    const result = calculateComplexity(message);

    expect(result.score).toBeLessThanOrEqual(100);
  });
});
