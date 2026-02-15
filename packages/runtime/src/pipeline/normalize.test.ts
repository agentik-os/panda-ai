import { describe, it, expect } from "vitest";
import { normalizeMessage } from "./normalize";

describe("normalizeMessage", () => {
  it("should normalize basic message", () => {
    const raw = {
      channel: "cli" as const,
      channelMessageId: "cli_123",
      userId: "user_1",
      content: "Hello world",
    };

    const normalized = normalizeMessage(raw);

    expect(normalized.channel).toBe("cli");
    expect(normalized.userId).toBe("user_1");
    expect(normalized.content).toBe("Hello world");
    expect(normalized.agentId).toBe("default");
    expect(normalized.id).toMatch(/^msg_\d+_/);
  });

  it("should normalize message with attachments", () => {
    const raw = {
      channel: "telegram" as const,
      channelMessageId: "tg_456",
      userId: "user_2",
      agentId: "agent_1",
      content: "Image attached",
      attachments: [
        {
          type: "image",
          url: "https://example.com/image.png",
          filename: "image.png",
          mimeType: "image/png",
          size: 1024,
        },
      ],
    };

    const normalized = normalizeMessage(raw);

    expect(normalized.attachments).toHaveLength(1);
    expect(normalized.attachments?.[0].type).toBe("image");
    expect(normalized.attachments?.[0].url).toBe(
      "https://example.com/image.png"
    );
  });

  it("should filter invalid attachments", () => {
    const raw = {
      channel: "web" as const,
      channelMessageId: "web_789",
      userId: "user_3",
      content: "Mixed attachments",
      attachments: [
        { type: "file", mimeType: "application/pdf", url: "https://example.com/file.pdf" },
        "invalid",
        null,
        { type: "missing_mimetype" },
      ],
    };

    const normalized = normalizeMessage(raw);

    expect(normalized.attachments).toHaveLength(1);
    expect(normalized.attachments?.[0].type).toBe("file");
    expect(normalized.attachments?.[0].mimeType).toBe("application/pdf");
  });

  it("should use default values for missing fields", () => {
    const raw = {
      channel: "api" as const,
      channelMessageId: "api_001",
      userId: "user_4",
      content: "Minimal message",
    };

    const normalized = normalizeMessage(raw);

    expect(normalized.agentId).toBe("default");
    expect(normalized.metadata).toEqual({});
    expect(normalized.timestamp).toBeInstanceOf(Date);
  });
});
