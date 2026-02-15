import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { devCommand } from "../../src/commands/dev";
import {
  existsSync,
  readFileSync,
  watch,
  statSync,
} from "fs";
import { execSync, spawn } from "child_process";

// Mock dependencies
vi.mock("chalk", () => ({
  default: {
    cyan: Object.assign((str: string) => str, {
      bold: (str: string) => str,
    }),
    green: (str: string) => str,
    yellow: (str: string) => str,
    red: (str: string) => str,
    dim: (str: string) => str,
    bold: (str: string) => str,
  },
}));

vi.mock("fs", () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  watch: vi.fn(),
  statSync: vi.fn(),
}));

vi.mock("child_process", () => ({
  execSync: vi.fn(),
  spawn: vi.fn(),
}));

describe("Dev Command", () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let processExitSpy: ReturnType<typeof vi.spyOn>;
  let processOnSpy: ReturnType<typeof vi.spyOn>;
  let processCwdSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });
    processOnSpy = vi.spyOn(process, "on").mockImplementation(() => process);
    processCwdSpy = vi.spyOn(process, "cwd").mockReturnValue("/tmp/test-skill");

    (existsSync as any).mockReturnValue(true);
    (readFileSync as any).mockReturnValue(
      JSON.stringify({
        id: "test-skill",
        name: "Test Skill",
        version: "1.0.0",
        description: "Test description",
      })
    );
    (statSync as any).mockReturnValue({ isDirectory: () => true });
    (execSync as any).mockReturnValue("");
    (watch as any).mockReturnValue({ close: vi.fn() });
    (spawn as any).mockReturnValue({
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      on: vi.fn(),
      kill: vi.fn(),
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    processExitSpy.mockRestore();
    processOnSpy.mockRestore();
    processCwdSpy.mockRestore();
  });

  describe("Directory Validation", () => {
    it("should error if directory doesn't exist", async () => {
      (existsSync as any).mockReturnValue(false);

      await expect(devCommand("/nonexistent")).rejects.toThrow("process.exit called");
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Not a valid directory")
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it("should error if path is not a directory", async () => {
      (existsSync as any).mockReturnValue(true);
      (statSync as any).mockReturnValue({ isDirectory: () => false });

      await expect(devCommand("/test/file.ts")).rejects.toThrow("process.exit called");
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Not a valid directory")
      );
    });

    it("should error if directory has no index.ts", async () => {
      (existsSync as any).mockImplementation((path: string) => {
        if (path === "/test/skill" || path.includes("skill.json")) return true;
        if (path.includes("index.ts")) return false;
        return true;
      });
      (statSync as any).mockReturnValue({ isDirectory: () => true });

      await expect(devCommand("/test/skill")).rejects.toThrow("process.exit called");
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("No index.ts found")
      );
    });

    it("should error if not in skill directory and no path provided", async () => {
      processCwdSpy.mockReturnValue("/tmp/not-a-skill");
      (existsSync as any).mockReturnValue(false);

      await expect(devCommand()).rejects.toThrow("process.exit called");
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Not in a skill directory")
      );
    });

    it("should use current directory if it has skill.json", async () => {
      processCwdSpy.mockReturnValue("/tmp/test-skill");
      (existsSync as any).mockImplementation((path: string) => {
        return path.includes("skill.json") || path.includes("index.ts") || path === "/tmp/test-skill";
      });
      (statSync as any).mockImplementation((path: string) => {
        return { isDirectory: () => true };
      });

      // Mock to prevent infinite loop
      const waitPromise = new Promise((resolve) => {
        setTimeout(resolve, 100);
      });

      const devPromise = devCommand();
      await Promise.race([devPromise, waitPromise]);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Test Skill")
      );
    });

    it("should use current directory if it has index.ts", async () => {
      processCwdSpy.mockReturnValue("/tmp/test-skill");
      (existsSync as any).mockImplementation((path: string) => {
        if (path.includes("index.ts")) return true;
        if (path.includes("skill.json")) return false;
        return true;
      });

      const waitPromise = new Promise((resolve) => {
        setTimeout(resolve, 100);
      });

      const devPromise = devCommand();
      await Promise.race([devPromise, waitPromise]);

      // Should not error since index.ts exists
      expect(processExitSpy).not.toHaveBeenCalled();
    });
  });

  describe("Manifest Loading", () => {
    it("should load skill.json when it exists", async () => {
      const manifest = {
        id: "web-search",
        name: "Web Search",
        version: "2.0.0",
        description: "Search the web",
      };
      (readFileSync as any).mockReturnValue(JSON.stringify(manifest));

      const waitPromise = new Promise((resolve) => {
        setTimeout(resolve, 100);
      });

      const devPromise = devCommand("/test/skill");
      await Promise.race([devPromise, waitPromise]);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Web Search")
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("web-search")
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("2.0.0")
      );
    });

    it("should handle corrupted skill.json gracefully", async () => {
      (readFileSync as any).mockReturnValue("invalid json {{{");

      const waitPromise = new Promise((resolve) => {
        setTimeout(resolve, 100);
      });

      const devPromise = devCommand("/test/skill");
      await Promise.race([devPromise, waitPromise]);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Could not parse skill.json")
      );
    });

    it("should work without skill.json (optional file)", async () => {
      (existsSync as any).mockImplementation((path: string) => {
        if (path.includes("skill.json")) return false;
        if (path.includes("index.ts")) return true;
        return true;
      });

      const waitPromise = new Promise((resolve) => {
        setTimeout(resolve, 100);
      });

      const devPromise = devCommand("/test/skill");
      await Promise.race([devPromise, waitPromise]);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Directory:")
      );
    });
  });

  describe("TypeScript Compilation", () => {
    it("should compile successfully with no errors", async () => {
      (execSync as any).mockReturnValue("");

      const waitPromise = new Promise((resolve) => {
        setTimeout(resolve, 100);
      });

      const devPromise = devCommand("/test/skill");
      await Promise.race([devPromise, waitPromise]);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Compiled successfully")
      );
    });

    it("should show TypeScript errors when compilation fails", async () => {
      const tsError = new Error("TypeScript compilation failed");
      (tsError as any).stdout =
        "index.ts(10,5): error TS2322: Type 'string' is not assignable to type 'number'.\n" +
        "index.ts(15,3): error TS2304: Cannot find name 'foo'.";
      (execSync as any).mockImplementation(() => {
        throw tsError;
      });

      const waitPromise = new Promise((resolve) => {
        setTimeout(resolve, 100);
      });

      const devPromise = devCommand("/test/skill");
      await Promise.race([devPromise, waitPromise]);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("2 TypeScript error(s)")
      );
    });

    it("should use tsconfig if it exists", async () => {
      (existsSync as any).mockImplementation((path: string) => {
        return true; // All files exist
      });

      const waitPromise = new Promise((resolve) => {
        setTimeout(resolve, 100);
      });

      const devPromise = devCommand("/test/skill");
      await Promise.race([devPromise, waitPromise]);

      expect(execSync).toHaveBeenCalledWith(
        "tsc --noEmit",
        expect.any(Object)
      );
    });

    it("should use strict mode if no tsconfig", async () => {
      (existsSync as any).mockImplementation((path: string) => {
        if (path.includes("tsconfig.json")) return false;
        return true;
      });

      const waitPromise = new Promise((resolve) => {
        setTimeout(resolve, 100);
      });

      const devPromise = devCommand("/test/skill");
      await Promise.race([devPromise, waitPromise]);

      expect(execSync).toHaveBeenCalledWith(
        "tsc --noEmit --strict",
        expect.any(Object)
      );
    });

    it("should show verbose compilation output when --verbose", async () => {
      const waitPromise = new Promise((resolve) => {
        setTimeout(resolve, 100);
      });

      const devPromise = devCommand("/test/skill", { verbose: true });
      await Promise.race([devPromise, waitPromise]);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Running: tsc")
      );
    });

    it("should limit error display to first 5 errors", async () => {
      const errors = Array.from({ length: 10 }, (_, i) =>
        `index.ts(${i},1): error TS2322: Error ${i}`
      ).join("\n");

      const tsError = new Error("TypeScript compilation failed");
      (tsError as any).stdout = errors;
      (execSync as any).mockImplementation(() => {
        throw tsError;
      });

      const waitPromise = new Promise((resolve) => {
        setTimeout(resolve, 100);
      });

      const devPromise = devCommand("/test/skill");
      await Promise.race([devPromise, waitPromise]);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("and 5 more errors")
      );
    });
  });

  describe("Options Handling", () => {
    it("should disable watching when watch=false", async () => {
      const waitPromise = new Promise((resolve) => {
        setTimeout(resolve, 100);
      });

      const devPromise = devCommand("/test/skill", { watch: false });
      await Promise.race([devPromise, waitPromise]);

      // watch should not be called
      expect(watch).not.toHaveBeenCalled();
    });

    it("should enable watching by default", async () => {
      const waitPromise = new Promise((resolve) => {
        setTimeout(resolve, 100);
      });

      const devPromise = devCommand("/test/skill");
      await Promise.race([devPromise, waitPromise]);

      expect(watch).toHaveBeenCalled();
    });

    it("should enable test watcher when --test", async () => {
      const waitPromise = new Promise((resolve) => {
        setTimeout(resolve, 100);
      });

      const devPromise = devCommand("/test/skill", { test: true });
      await Promise.race([devPromise, waitPromise]);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Test watcher enabled")
      );
      expect(spawn).toHaveBeenCalled();
    });

    it("should not run tests by default", async () => {
      const waitPromise = new Promise((resolve) => {
        setTimeout(resolve, 100);
      });

      const devPromise = devCommand("/test/skill");
      await Promise.race([devPromise, waitPromise]);

      expect(spawn).not.toHaveBeenCalled();
    });
  });

  describe("Console Output", () => {
    it("should show dev server header", async () => {
      const waitPromise = new Promise((resolve) => {
        setTimeout(resolve, 100);
      });

      const devPromise = devCommand("/test/skill");
      await Promise.race([devPromise, waitPromise]);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Agentik OS Skill Dev Server")
      );
    });

    it("should show instructions to stop server", async () => {
      const waitPromise = new Promise((resolve) => {
        setTimeout(resolve, 100);
      });

      const devPromise = devCommand("/test/skill");
      await Promise.race([devPromise, waitPromise]);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Press Ctrl+C to stop")
      );
    });

    it("should register SIGINT handler", async () => {
      const waitPromise = new Promise((resolve) => {
        setTimeout(resolve, 100);
      });

      const devPromise = devCommand("/test/skill");
      await Promise.race([devPromise, waitPromise]);

      expect(processOnSpy).toHaveBeenCalledWith("SIGINT", expect.any(Function));
    });

    it("should register SIGTERM handler", async () => {
      const waitPromise = new Promise((resolve) => {
        setTimeout(resolve, 100);
      });

      const devPromise = devCommand("/test/skill");
      await Promise.race([devPromise, waitPromise]);

      expect(processOnSpy).toHaveBeenCalledWith("SIGTERM", expect.any(Function));
    });
  });

  describe("Path Resolution", () => {
    it("should resolve relative paths", async () => {
      const waitPromise = new Promise((resolve) => {
        setTimeout(resolve, 100);
      });

      const devPromise = devCommand("./skills/test-skill");
      await Promise.race([devPromise, waitPromise]);

      expect(existsSync).toHaveBeenCalled();
    });

    it("should resolve absolute paths", async () => {
      const waitPromise = new Promise((resolve) => {
        setTimeout(resolve, 100);
      });

      const devPromise = devCommand("/absolute/path/to/skill");
      await Promise.race([devPromise, waitPromise]);

      expect(existsSync).toHaveBeenCalled();
    });
  });
});
