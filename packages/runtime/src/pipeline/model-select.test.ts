import { describe, it, expect } from "vitest";
import { selectModelForMessage } from "./model-select";
import type { Message } from "@agentik-os/shared";

const createMessage = (content: string): Message => ({
  id: "msg_1",
  channel: "cli",
  channelMessageId: "test_1",
  userId: "user_1",
  agentId: "test-agent",
  content,
  metadata: {},
  timestamp: new Date(),
});

describe("selectModelForMessage", () => {
  it("should select Haiku for simple message", async () => {
    const message = createMessage("Hello");
    const result = await selectModelForMessage(message);

    expect(result.selection.model).toBe("claude-haiku-4-5");
    expect(result.complexity).toBeLessThan(30);
  });

  it("should select Sonnet for medium complexity", async () => {
    const longMessage = "Explain the concept of async/await in JavaScript. ".repeat(10) +
      "Please analyze the differences between promises and async/await patterns.";
    const message = createMessage(longMessage);
    const result = await selectModelForMessage(message);

    expect(result.selection.model).toBe("claude-sonnet-4-5");
    expect(result.complexity).toBeGreaterThan(30);
  });

  it("should select Opus for complex code tasks", async () => {
    const codeMessage = `Implement a complex algorithm to optimize database queries.
Here's the current code:
\`\`\`typescript
function optimizeQuery() {
  // Implementation needed
}
\`\`\`
Please refactor and implement a more efficient version.`;
    const message = createMessage(codeMessage);
    const result = await selectModelForMessage(message);

    expect(result.selection.model).toBe("claude-opus-4");
    expect(result.complexity).toBeGreaterThan(60);
  });

  it("should respect budget preferences", async () => {
    const message = createMessage("Implement a sorting algorithm");
    const result = await selectModelForMessage(message, {
      preferences: {
        budgetMode: "cost-effective",
      },
    });

    expect(result.selection.model).toBe("claude-haiku-4-5");
  });

  it("should respect provider preferences", async () => {
    const message = createMessage("Hello world");
    const result = await selectModelForMessage(message, {
      preferences: {
        preferredProvider: "openai",
      },
    });

    expect(result.selection.provider).toBe("openai");
  });
});
