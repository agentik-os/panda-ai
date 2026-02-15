/**
 * Tests for Marketplace Uploader
 * Target: >80% coverage
 *
 * Note: This file tests the uploader functionality with mocked dependencies.
 * The createArchive function is tested indirectly through uploadToMarketplace.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock dependencies before import
vi.mock("fs/promises", () => ({
  default: {
    mkdtemp: vi.fn(),
    rm: vi.fn(),
  },
  mkdtemp: vi.fn(),
  rm: vi.fn(),
}));

vi.mock("fs", () => ({
  createReadStream: vi.fn(() => ({
    pipe: vi.fn(),
  })),
  createWriteStream: vi.fn(() => ({
    on: vi.fn((event: string, handler: Function) => {
      if (event === "close") {
        // Simulate immediate close
        setTimeout(() => handler(), 0);
      }
      return { on: vi.fn() };
    }),
  })),
}));

vi.mock("form-data", () => {
  return {
    default: vi.fn().mockImplementation(function() {
      return {
        append: vi.fn(),
        getHeaders: vi.fn(() => ({ "content-type": "multipart/form-data" })),
      };
    }),
  };
});

vi.mock("archiver", () => ({
  default: vi.fn(() => ({
    pipe: vi.fn(),
    glob: vi.fn(),
    finalize: vi.fn(),
    on: vi.fn((event: string, handler: Function) => {
      // Don't trigger error
      return { on: vi.fn() };
    }),
  })),
}));

// Now import after mocks are set up
import { uploadToMarketplace } from "../src/utils/uploader";
import fs from "fs/promises";

describe("Marketplace Uploader", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env = { ...originalEnv };

    // Default mocks
    vi.mocked(fs.mkdtemp).mockResolvedValue("/tmp/agentik-test123");
    vi.mocked(fs.rm).mockResolvedValue(undefined);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("uploadToMarketplace", () => {
    const mockMetadata = {
      name: "test-package",
      version: "1.0.0",
      description: "Test package",
    };

    beforeEach(() => {
      process.env.AGENTIK_AUTH_TOKEN = "test-token-123";
    });

    it("should upload agent package successfully", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          packageId: "agent-123",
          downloadUrl: "https://example.com/agent-123.tar.gz",
        }),
      });

      const result = await uploadToMarketplace(
        "/path/to/agent",
        "agent",
        mockMetadata
      );

      expect(result).toEqual({
        packageId: "agent-123",
        version: "1.0.0",
        downloadUrl: "https://example.com/agent-123.tar.gz",
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/publish"),
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer test-token-123",
          }),
        })
      );
    });

    it("should upload skill package successfully", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          packageId: "skill-456",
          downloadUrl: "https://example.com/skill-456.tar.gz",
        }),
      });

      const result = await uploadToMarketplace(
        "/path/to/skill",
        "skill",
        mockMetadata
      );

      expect(result.packageId).toBe("skill-456");
      expect(result.version).toBe("1.0.0");
    });

    it("should create temporary directory for archive", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          packageId: "pkg-789",
          downloadUrl: "https://example.com/pkg.tar.gz",
        }),
      });

      await uploadToMarketplace("/path/to/package", "agent", mockMetadata);

      expect(fs.mkdtemp).toHaveBeenCalled();
    });

    it("should cleanup temporary directory after upload", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          packageId: "pkg-cleanup",
          downloadUrl: "https://example.com/pkg.tar.gz",
        }),
      });

      await uploadToMarketplace("/path/to/package", "agent", mockMetadata);

      expect(fs.rm).toHaveBeenCalledWith(
        "/tmp/agentik-test123",
        { recursive: true, force: true }
      );
    });

    it("should cleanup temporary directory even on error", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        text: async () => "Upload failed",
      });

      await expect(
        uploadToMarketplace("/path/to/package", "agent", mockMetadata)
      ).rejects.toThrow("Upload failed: Upload failed");

      expect(fs.rm).toHaveBeenCalled();
    });

    it("should use custom marketplace URL from environment", async () => {
      process.env.AGENTIK_MARKETPLACE_URL = "https://custom.marketplace.com";

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          packageId: "custom-pkg",
          downloadUrl: "https://custom.com/pkg.tar.gz",
        }),
      });

      await uploadToMarketplace("/path/to/package", "agent", mockMetadata);

      expect(fetch).toHaveBeenCalledWith(
        "https://custom.marketplace.com/publish",
        expect.any(Object)
      );
    });

    it("should use default marketplace URL if not set", async () => {
      delete process.env.AGENTIK_MARKETPLACE_URL;

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          packageId: "default-pkg",
          downloadUrl: "https://default.com/pkg.tar.gz",
        }),
      });

      await uploadToMarketplace("/path/to/package", "agent", mockMetadata);

      expect(fetch).toHaveBeenCalledWith(
        "https://api.agentik-os.com/marketplace/publish",
        expect.any(Object)
      );
    });

    it("should throw error if API returns non-ok response", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        text: async () => "Invalid package format",
      });

      await expect(
        uploadToMarketplace("/path/to/package", "agent", mockMetadata)
      ).rejects.toThrow("Upload failed: Invalid package format");
    });

    it("should throw error if no auth token is set", async () => {
      delete process.env.AGENTIK_AUTH_TOKEN;

      await expect(
        uploadToMarketplace("/path/to/package", "agent", mockMetadata)
      ).rejects.toThrow(
        "No authentication token found. Run 'panda login' first or set AGENTIK_AUTH_TOKEN"
      );
    });

    it("should handle network errors gracefully", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Network timeout"));

      await expect(
        uploadToMarketplace("/path/to/package", "agent", mockMetadata)
      ).rejects.toThrow("Network timeout");

      // Should still cleanup
      expect(fs.rm).toHaveBeenCalled();
    });

    it("should handle different package versions", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          packageId: "version-test",
          downloadUrl: "https://example.com/version.tar.gz",
        }),
      });

      const metadata = {
        name: "my-package",
        version: "3.1.4",
      };

      const result = await uploadToMarketplace("/path/to/package", "skill", metadata);

      expect(result.version).toBe("3.1.4");
    });

    it("should handle scoped package names", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          packageId: "scoped-pkg",
          downloadUrl: "https://example.com/scoped.tar.gz",
        }),
      });

      const metadata = {
        name: "@org/package-name",
        version: "1.0.0",
      };

      await expect(
        uploadToMarketplace("/path", "agent", metadata)
      ).resolves.toBeDefined();
    });

    it("should handle beta versions", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          packageId: "beta-pkg",
          downloadUrl: "https://example.com/beta.tar.gz",
        }),
      });

      const metadata = {
        name: "beta-package",
        version: "2.0.0-beta.1",
      };

      const result = await uploadToMarketplace("/path", "skill", metadata);

      expect(result.version).toBe("2.0.0-beta.1");
    });

    it("should handle API JSON parsing errors", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error("Invalid JSON");
        },
      });

      await expect(
        uploadToMarketplace("/path", "agent", mockMetadata)
      ).rejects.toThrow("Invalid JSON");

      // Cleanup should still happen
      expect(fs.rm).toHaveBeenCalled();
    });

    it("should handle fs.mkdtemp errors", async () => {
      vi.mocked(fs.mkdtemp).mockRejectedValue(new Error("No space left"));

      await expect(
        uploadToMarketplace("/path", "agent", mockMetadata)
      ).rejects.toThrow("No space left");
    });
  });

  describe("Authentication", () => {
    beforeEach(() => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          packageId: "auth-test",
          downloadUrl: "https://example.com/auth.tar.gz",
        }),
      });
    });

    it("should include Authorization header with Bearer token", async () => {
      process.env.AGENTIK_AUTH_TOKEN = "my-secret-token";

      await uploadToMarketplace("/path", "agent", {
        name: "test",
        version: "1.0.0",
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer my-secret-token",
          }),
        })
      );
    });

    it("should fail fast if token is missing", async () => {
      delete process.env.AGENTIK_AUTH_TOKEN;

      await expect(
        uploadToMarketplace("/path", "agent", { name: "test", version: "1.0.0" })
      ).rejects.toThrow("No authentication token found");

      // Fetch should not be called
      expect(fetch).not.toHaveBeenCalled();
    });
  });
});
