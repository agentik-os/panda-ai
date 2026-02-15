import { describe, it, expect, beforeEach } from "vitest";
import {
  SentryTracker,
  captureAgentError,
  captureChannelError,
} from "../../../packages/runtime/src/observability/sentry";

describe("Sentry Error Tracking", () => {
  let tracker: SentryTracker;

  beforeEach(() => {
    tracker = new SentryTracker();
    tracker.init({
      environment: "test",
      release: "1.0.0-test",
      sampleRate: 1.0,
    });
  });

  describe("init", () => {
    it("should initialize with config", () => {
      expect(tracker.isInitialized()).toBe(true);
    });
  });

  describe("captureException", () => {
    it("should capture an error", () => {
      const error = new Error("Test error");
      const eventId = tracker.captureException(error);
      expect(eventId).toBeTruthy();
      expect(eventId.length).toBe(32);
    });

    it("should capture string errors", () => {
      const eventId = tracker.captureException("String error");
      expect(eventId).toBeTruthy();

      const events = tracker.getRecentErrors();
      expect(events.length).toBe(1);
      expect(events[0].message).toBe("String error");
    });

    it("should include exception details", () => {
      const error = new TypeError("Invalid type");
      tracker.captureException(error);

      const events = tracker.getRecentErrors();
      expect(events[0].exception?.type).toBe("TypeError");
      expect(events[0].exception?.value).toBe("Invalid type");
    });

    it("should include tags and extra context", () => {
      tracker.captureException(new Error("Test"), {
        tags: { agent_id: "agent-1" },
        extra: { input: "hello" },
      });

      const events = tracker.getRecentErrors();
      expect(events[0].tags.agent_id).toBe("agent-1");
      expect(events[0].extra.input).toBe("hello");
    });

    it("should include breadcrumbs", () => {
      tracker.addBreadcrumb({
        category: "navigation",
        message: "Visited /dashboard",
        level: "info",
      });
      tracker.captureException(new Error("Test"));

      const events = tracker.getRecentErrors();
      expect(events[0].breadcrumbs.length).toBeGreaterThanOrEqual(2); // init + manual
    });
  });

  describe("captureMessage", () => {
    it("should capture info messages", () => {
      tracker.captureMessage("Something happened", "info");

      const events = tracker.getEvents({ level: "info" });
      expect(events.length).toBe(1);
      expect(events[0].message).toBe("Something happened");
    });
  });

  describe("PII filtering", () => {
    it("should redact email addresses", () => {
      tracker.captureException(
        new Error("Failed for user@example.com"),
      );

      const events = tracker.getRecentErrors();
      expect(events[0].message).toContain("[REDACTED]");
      expect(events[0].message).not.toContain("user@example.com");
    });

    it("should redact API keys", () => {
      tracker.captureException(
        new Error("Auth failed with sk-abc123456789012345678901"),
      );

      const events = tracker.getRecentErrors();
      expect(events[0].message).toContain("[REDACTED]");
    });

    it("should redact password fields in extra context", () => {
      tracker.captureException(new Error("Test"), {
        extra: { password: "secret123", username: "user" },
      });

      const events = tracker.getRecentErrors();
      expect(events[0].extra.password).toBe("[REDACTED]");
      expect(events[0].extra.username).toBe("user");
    });

    it("should redact authorization headers", () => {
      tracker.captureException(new Error("Test"), {
        extra: { authorization: "Bearer eyJhbGciOi..." },
      });

      const events = tracker.getRecentErrors();
      expect(events[0].extra.authorization).toBe("[REDACTED]");
    });
  });

  describe("beforeSend filter", () => {
    it("should allow filtering events", () => {
      const filtered = new SentryTracker();
      filtered.init({
        environment: "test",
        beforeSend: (event) => {
          if (event.message.includes("ignore")) return null;
          return event;
        },
      });

      filtered.captureException(new Error("ignore this"));
      filtered.captureException(new Error("keep this"));

      const events = filtered.getRecentErrors();
      expect(events.length).toBe(1);
      expect(events[0].message).toBe("keep this");
    });
  });

  describe("withScope", () => {
    it("should add scope tags and capture errors", async () => {
      await expect(
        tracker.withScope({ operation: "test" }, async () => {
          throw new Error("Scoped error");
        }),
      ).rejects.toThrow("Scoped error");

      const events = tracker.getRecentErrors();
      expect(events.length).toBe(1);
      expect(events[0].tags.operation).toBe("test");
    });

    it("should restore tags after scope", async () => {
      tracker.setTag("global", "yes");

      try {
        await tracker.withScope({ scoped: "yes" }, async () => {
          throw new Error("fail");
        });
      } catch {
        // Expected
      }

      // Global tag should not have scoped tag
      tracker.captureMessage("after scope", "info");
      const events = tracker.getEvents({ level: "info" });
      expect(events[0].tags.global).toBe("yes");
      expect(events[0].tags.scoped).toBeUndefined();
    });
  });

  describe("getErrorStats", () => {
    it("should return error statistics", () => {
      tracker.captureException(new Error("err1"));
      tracker.captureException(new Error("err2"));
      tracker.captureMessage("warn", "warning");
      tracker.captureMessage("info", "info");

      const stats = tracker.getErrorStats();
      expect(stats.total).toBe(4);
      expect(stats.byLevel.error).toBe(2);
      expect(stats.byLevel.warning).toBe(1);
      expect(stats.byLevel.info).toBe(1);
    });
  });

  describe("convenience functions", () => {
    it("captureAgentError should tag with agent_id", () => {
      // Uses the singleton, test it doesn't throw
      const eventId = captureAgentError(
        new Error("Agent failed"),
        "agent-123",
        { step: 5 },
      );
      expect(typeof eventId).toBe("string");
    });

    it("captureChannelError should tag with channel", () => {
      const eventId = captureChannelError(
        new Error("Channel error"),
        "telegram",
      );
      expect(typeof eventId).toBe("string");
    });
  });

  describe("clear", () => {
    it("should clear all events and breadcrumbs", () => {
      tracker.captureException(new Error("test"));
      tracker.addBreadcrumb({ category: "test", message: "test", level: "info" });
      tracker.clear();

      expect(tracker.getRecentErrors().length).toBe(0);
      expect(tracker.getEvents().length).toBe(0);
    });
  });
});
