/**
 * Tests for Convex Client
 * Step-094: Natural Language Automation Parser
 *
 * Target: >80% coverage (currently 14.28%)
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { getConvexClient, api } from "./convex-client";

describe("Convex Client", () => {
  // Save original env
  const originalEnv = process.env.CONVEX_URL;

  beforeEach(() => {
    // Clear the module cache to reset singleton
    vi.resetModules();
    // Clear console spies
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original env
    process.env.CONVEX_URL = originalEnv;
  });

  describe("getConvexClient()", () => {
    it("should create client with CONVEX_URL from environment", async () => {
      process.env.CONVEX_URL = "https://test-deployment.convex.cloud";

      // Dynamic import to get fresh module with new env
      const { getConvexClient } = await import("./convex-client");
      const client = getConvexClient();

      expect(client).toBeDefined();
      expect(client).toHaveProperty("query");
      expect(client).toHaveProperty("mutation");
      expect(client).toHaveProperty("action");
    });

    it("should use placeholder URL when CONVEX_URL not set", async () => {
      delete process.env.CONVEX_URL;

      const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});

      const { getConvexClient } = await import("./convex-client");
      const client = getConvexClient();

      expect(client).toBeDefined();
      expect(consoleWarn).toHaveBeenCalledWith(
        expect.stringContaining("[Convex] CONVEX_URL not set")
      );
      expect(consoleWarn).toHaveBeenCalledWith(
        expect.stringContaining("placeholder")
      );

      consoleWarn.mockRestore();
    });

    it("should log warning with helpful message for placeholder URL", async () => {
      delete process.env.CONVEX_URL;

      const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});

      const { getConvexClient } = await import("./convex-client");
      getConvexClient();

      expect(consoleWarn).toHaveBeenCalledWith(
        expect.stringContaining("Run `npx convex dev` first")
      );

      consoleWarn.mockRestore();
    });

    it("should return singleton instance (same client on multiple calls)", async () => {
      process.env.CONVEX_URL = "https://test-deployment.convex.cloud";

      const { getConvexClient } = await import("./convex-client");
      const client1 = getConvexClient();
      const client2 = getConvexClient();

      expect(client1).toBe(client2); // Same reference
    });

    it("should only log warning once for placeholder (singleton behavior)", async () => {
      delete process.env.CONVEX_URL;

      const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});

      const { getConvexClient } = await import("./convex-client");
      getConvexClient();
      getConvexClient();
      getConvexClient();

      // Warning only logged once (on first call)
      expect(consoleWarn).toHaveBeenCalledTimes(1);

      consoleWarn.mockRestore();
    });

    it("should accept custom Convex deployment URLs", async () => {
      process.env.CONVEX_URL = "https://custom-123.convex.cloud";

      const { getConvexClient } = await import("./convex-client");
      const client = getConvexClient();

      expect(client).toBeDefined();
    });

    it("should handle CONVEX_URL with trailing slash", async () => {
      process.env.CONVEX_URL = "https://test-deployment.convex.cloud/";

      const { getConvexClient } = await import("./convex-client");
      const client = getConvexClient();

      expect(client).toBeDefined();
    });

    it("should handle CONVEX_URL without https protocol", async () => {
      process.env.CONVEX_URL = "http://localhost:3210"; // Local dev

      const { getConvexClient } = await import("./convex-client");
      const client = getConvexClient();

      expect(client).toBeDefined();
    });
  });

  describe("api export", () => {
    it("should export api object from generated schema", () => {
      expect(api).toBeDefined();
      expect(api).toHaveProperty("queries");
      expect(api).toHaveProperty("mutations");
      expect(api).toHaveProperty("actions");
    });

    it("should have queries object", () => {
      expect(api.queries).toBeDefined();
      expect(typeof api.queries).toBe("object");
    });

    it("should have mutations object", () => {
      expect(api.mutations).toBeDefined();
      expect(typeof api.mutations).toBe("object");
    });

    it("should have actions object", () => {
      expect(api.actions).toBeDefined();
      expect(typeof api.actions).toBe("object");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty CONVEX_URL env var", async () => {
      process.env.CONVEX_URL = "";

      const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});

      const { getConvexClient } = await import("./convex-client");
      const client = getConvexClient();

      // Empty string is falsy, should use placeholder
      expect(client).toBeDefined();
      expect(consoleWarn).toHaveBeenCalled();

      consoleWarn.mockRestore();
    });

    it("should throw error for whitespace-only CONVEX_URL", async () => {
      process.env.CONVEX_URL = "   ";

      const { getConvexClient } = await import("./convex-client");

      // ConvexHttpClient validates URL format
      expect(() => getConvexClient()).toThrow(/Invalid deployment address/);
    });

    it("should throw error for invalid URL format", async () => {
      process.env.CONVEX_URL = "not-a-valid-url";

      const { getConvexClient } = await import("./convex-client");

      // ConvexHttpClient validates URL format
      expect(() => getConvexClient()).toThrow(/Invalid deployment address/);
    });
  });

  describe("Client Instance Properties", () => {
    it("should have query method", async () => {
      process.env.CONVEX_URL = "https://test.convex.cloud";

      const { getConvexClient } = await import("./convex-client");
      const client = getConvexClient();

      expect(client.query).toBeDefined();
      expect(typeof client.query).toBe("function");
    });

    it("should have mutation method", async () => {
      process.env.CONVEX_URL = "https://test.convex.cloud";

      const { getConvexClient } = await import("./convex-client");
      const client = getConvexClient();

      expect(client.mutation).toBeDefined();
      expect(typeof client.mutation).toBe("function");
    });

    it("should have action method", async () => {
      process.env.CONVEX_URL = "https://test.convex.cloud";

      const { getConvexClient } = await import("./convex-client");
      const client = getConvexClient();

      expect(client.action).toBeDefined();
      expect(typeof client.action).toBe("function");
    });
  });
});
