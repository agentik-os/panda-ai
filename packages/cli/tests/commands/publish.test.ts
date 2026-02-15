import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { publish } from "../../src/commands/publish";
import { validatePackage } from "../../src/utils/package-validator";
import { uploadToMarketplace } from "../../src/utils/uploader";
import { runSecurityScan } from "@agentik-os/runtime/src/security/semgrep";
import fs from "fs/promises";

// Mock dependencies
vi.mock("chalk", () => {
  const mockChalk = (str: string) => str;
  mockChalk.cyan = (str: string) => str;
  mockChalk.green = (str: string) => str;
  mockChalk.yellow = (str: string) => str;
  mockChalk.red = (str: string) => str;
  mockChalk.gray = (str: string) => str;
  mockChalk.blue = (str: string) => str;
  mockChalk.magenta = (str: string) => str;
  mockChalk.white = (str: string) => str;
  mockChalk.bold = (str: string) => str;
  mockChalk.dim = (str: string) => str;
  return {
    default: mockChalk,
  };
});

vi.mock("ora", () => ({
  default: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
    warn: vi.fn().mockReturnThis(),
  })),
}));

vi.mock("fs/promises", () => ({
  default: {
    access: vi.fn(),
  },
}));

vi.mock("../../src/utils/package-validator", () => ({
  validatePackage: vi.fn(),
}));

vi.mock("../../src/utils/uploader", () => ({
  uploadToMarketplace: vi.fn(),
}));

vi.mock("@agentik-os/runtime/src/security/semgrep", () => ({
  runSecurityScan: vi.fn(),
}));

vi.mock("@inquirer/prompts", () => ({
  confirm: vi.fn(),
}));

describe("Publish Command", () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let processExitSpy: ReturnType<typeof vi.spyOn>;
  let processCwdSpy: ReturnType<typeof vi.spyOn>;

  let mockValidatePackage: ReturnType<typeof vi.fn>;
  let mockUploadToMarketplace: ReturnType<typeof vi.fn>;
  let mockRunSecurityScan: ReturnType<typeof vi.fn>;
  let mockConfirm: ReturnType<typeof vi.fn>;
  let mockAccess: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    // Get mocks from imported modules
    mockValidatePackage = validatePackage as ReturnType<typeof vi.fn>;
    mockUploadToMarketplace = uploadToMarketplace as ReturnType<typeof vi.fn>;
    mockRunSecurityScan = runSecurityScan as ReturnType<typeof vi.fn>;
    const { confirm } = await import("@inquirer/prompts");
    mockConfirm = confirm as ReturnType<typeof vi.fn>;
    mockAccess = fs.access as ReturnType<typeof vi.fn>;

    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });
    processCwdSpy = vi.spyOn(process, "cwd").mockReturnValue("/tmp/test-package");

    // Default successful mocks
    mockValidatePackage.mockResolvedValue({
      valid: true,
      errors: [],
      warnings: [],
      metadata: { name: "test-package", version: "1.0.0" },
    });

    mockRunSecurityScan.mockResolvedValue({
      criticalIssues: 0,
      highIssues: 0,
      issues: [],
    });

    mockUploadToMarketplace.mockResolvedValue({
      packageId: "test-123",
    });

    mockAccess.mockRejectedValue(new Error("File not found"));

    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
    processCwdSpy.mockRestore();
  });

  describe("Package Type Detection", () => {
    it("should detect skill type from skill.json", async () => {
      mockAccess.mockImplementation((path: string) => {
        if (path.includes("skill.json")) {
          return Promise.resolve();
        }
        return Promise.reject(new Error("Not found"));
      });

      await publish("/tmp/test-package", {});

      expect(mockValidatePackage).toHaveBeenCalledWith("/tmp/test-package", "skill");
    });

    it("should detect agent type from agent.json", async () => {
      mockAccess.mockImplementation((path: string) => {
        if (path.includes("agent.json")) {
          return Promise.resolve();
        }
        return Promise.reject(new Error("Not found"));
      });

      await publish("/tmp/test-package", {});

      expect(mockValidatePackage).toHaveBeenCalledWith("/tmp/test-package", "agent");
    });

    it("should use provided type option", async () => {
      await publish("/tmp/test-package", { type: "agent" });

      expect(mockValidatePackage).toHaveBeenCalledWith("/tmp/test-package", "agent");
    });

    it("should error on invalid type option", async () => {
      await expect(
        publish("/tmp/test-package", { type: "invalid" as any })
      ).rejects.toThrow("process.exit called");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid type: invalid')
      );
    });

    it("should error when no manifest files found", async () => {
      mockAccess.mockRejectedValue(new Error("Not found"));

      await expect(
        publish("/tmp/test-package", {})
      ).rejects.toThrow("process.exit called");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Could not detect package type")
      );
    });
  });

  describe("Package Validation", () => {
    it("should pass validation with no errors", async () => {
      mockAccess.mockResolvedValue(undefined);

      await publish("/tmp/test-package", { type: "skill" });

      expect(mockValidatePackage).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Your package is now live")
      );
    });

    it("should fail when validation errors exist", async () => {
      mockValidatePackage.mockResolvedValue({
        valid: false,
        errors: ["Missing required field: name", "Invalid version format"],
        warnings: [],
      });

      await expect(
        publish("/tmp/test-package", { type: "skill" })
      ).rejects.toThrow("process.exit called");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Missing required field: name")
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Invalid version format")
      );
    });

    it("should show warnings but continue", async () => {
      mockValidatePackage.mockResolvedValue({
        valid: true,
        errors: [],
        warnings: ["Missing recommended field: description"],
        metadata: {},
      });

      await publish("/tmp/test-package", { type: "skill" });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Missing recommended field")
      );
      expect(mockUploadToMarketplace).toHaveBeenCalled();
    });
  });

  describe("Security Scanning", () => {
    it("should pass with no security issues", async () => {
      mockRunSecurityScan.mockResolvedValue({
        criticalIssues: 0,
        highIssues: 0,
        issues: [],
      });

      await publish("/tmp/test-package", { type: "skill" });

      expect(mockRunSecurityScan).toHaveBeenCalled();
      expect(mockUploadToMarketplace).toHaveBeenCalled();
    });

    it("should fail with critical security issues", async () => {
      mockRunSecurityScan.mockResolvedValue({
        criticalIssues: 1,
        highIssues: 0,
        issues: [
          { severity: "critical", message: "SQL injection vulnerability", file: "index.ts" },
        ],
      });

      await expect(
        publish("/tmp/test-package", { type: "skill" })
      ).rejects.toThrow("process.exit called");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("SQL injection vulnerability")
      );
      expect(mockUploadToMarketplace).not.toHaveBeenCalled();
    });

    it("should warn on high severity issues and ask for confirmation", async () => {
      mockRunSecurityScan.mockResolvedValue({
        criticalIssues: 0,
        highIssues: 1,
        issues: [
          { severity: "high", message: "Unvalidated input", file: "handler.ts" },
        ],
      });
      mockConfirm.mockResolvedValue(true);

      await publish("/tmp/test-package", { type: "skill" });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Unvalidated input")
      );
      expect(mockConfirm).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("Continue publishing despite security warnings?"),
        })
      );
      expect(mockUploadToMarketplace).toHaveBeenCalled();
    });

    it("should cancel when user declines high severity confirmation", async () => {
      mockRunSecurityScan.mockResolvedValue({
        criticalIssues: 0,
        highIssues: 1,
        issues: [
          { severity: "high", message: "Unvalidated input", file: "handler.ts" },
        ],
      });
      mockConfirm.mockResolvedValue(false);

      await expect(
        publish("/tmp/test-package", { type: "skill" })
      ).rejects.toThrow("process.exit called");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("cancelled")
      );
      expect(mockUploadToMarketplace).not.toHaveBeenCalled();
    });

    it("should skip security scan with --skip-security", async () => {
      await publish("/tmp/test-package", { type: "skill", skipSecurity: true });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Security scan skipped")
      );
      expect(mockRunSecurityScan).not.toHaveBeenCalled();
      expect(mockUploadToMarketplace).toHaveBeenCalled();
    });
  });

  describe("Dry Run Mode", () => {
    it("should validate but not upload in dry run", async () => {
      await publish("/tmp/test-package", { type: "skill", dryRun: true });

      expect(mockValidatePackage).toHaveBeenCalled();
      expect(mockRunSecurityScan).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Package is ready to publish")
      );
      expect(mockUploadToMarketplace).not.toHaveBeenCalled();
    });

    it("should show ready message in dry run", async () => {
      await publish("/tmp/test-package", { type: "skill", dryRun: true });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Package is ready to publish")
      );
    });
  });

  describe("Upload to Marketplace", () => {
    it("should upload successfully", async () => {
      mockUploadToMarketplace.mockResolvedValue({
        packageId: "skill-abc-123",
      });

      await publish("/tmp/test-package", { type: "skill" });

      expect(mockUploadToMarketplace).toHaveBeenCalledWith(
        "/tmp/test-package",
        "skill",
        expect.any(Object)
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("skill-abc-123")
      );
    });

    it("should show marketplace URL after upload", async () => {
      mockUploadToMarketplace.mockResolvedValue({
        packageId: "skill-xyz-789",
      });

      await publish("/tmp/test-package", { type: "skill" });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("https://marketplace.agentik-os.com/skills/skill-xyz-789")
      );
    });
  });

  describe("Error Handling", () => {
    it("should handle validation error", async () => {
      mockValidatePackage.mockRejectedValue(new Error("Validation service unavailable"));

      await expect(
        publish("/tmp/test-package", { type: "skill" })
      ).rejects.toThrow("process.exit called");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Validation service unavailable")
      );
    });

    it("should handle security scan error", async () => {
      mockRunSecurityScan.mockRejectedValue(new Error("Semgrep not installed"));

      await expect(
        publish("/tmp/test-package", { type: "skill" })
      ).rejects.toThrow("process.exit called");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Semgrep not installed")
      );
    });

    it("should handle upload error", async () => {
      mockUploadToMarketplace.mockRejectedValue(new Error("Network timeout"));

      await expect(
        publish("/tmp/test-package", { type: "skill" })
      ).rejects.toThrow("process.exit called");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Network timeout")
      );
    });
  });

  describe("Option Combinations", () => {
    it("should handle --type agent with --dry-run", async () => {
      await publish("/tmp/test-package", { type: "agent", dryRun: true });

      expect(mockValidatePackage).toHaveBeenCalledWith("/tmp/test-package", "agent");
      expect(mockUploadToMarketplace).not.toHaveBeenCalled();
    });

    it("should handle --skip-security with --dry-run", async () => {
      await publish("/tmp/test-package", { type: "skill", skipSecurity: true, dryRun: true });

      expect(mockRunSecurityScan).not.toHaveBeenCalled();
      expect(mockUploadToMarketplace).not.toHaveBeenCalled();
    });

    it("should handle all options together", async () => {
      await publish("/tmp/test-package", { type: "agent", skipSecurity: true, dryRun: true });

      expect(mockValidatePackage).toHaveBeenCalledWith("/tmp/test-package", "agent");
      expect(mockRunSecurityScan).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Package is ready to publish")
      );
    });
  });
});
