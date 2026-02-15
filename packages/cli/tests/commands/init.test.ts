import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { initCommand } from "../../src/commands/init";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";

// Mock dependencies
vi.mock("chalk", () => ({
  default: {
    cyan: Object.assign((str: string) => str, {
      bold: (str: string) => str,
    }),
    green: (str: string) => str,
    yellow: (str: string) => str,
    dim: (str: string) => str,
  },
}));

vi.mock("ora", () => ({
  default: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
    stop: vi.fn().mockReturnThis(),
    text: "",
  })),
}));

vi.mock("inquirer", () => ({
  default: {
    prompt: vi.fn(),
  },
}));

vi.mock("fs", () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
}));

describe("Init Command", () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  const mockTemplate = {
    version: "1.0.0",
    runtime: {
      port: 3000,
      host: "localhost",
      dataDir: "~/.agentik-os/data",
    },
    models: {
      anthropic: {
        apiKey: "",
        defaultModel: "claude-4-5-sonnet-20251022",
        enabled: false,
      },
      openai: {
        apiKey: "",
        defaultModel: "gpt-5",
        enabled: false,
      },
      google: {
        apiKey: "",
        defaultModel: "gemini-2.0-flash-exp",
        enabled: false,
      },
      ollama: {
        baseUrl: "http://localhost:11434",
        defaultModel: "llama3.2",
        enabled: false,
      },
    },
    router: {
      enabled: false,
      strategy: "cost-aware",
      fallbackModel: "claude-4-5-sonnet-20251022",
    },
    memory: {
      enabled: true,
      backend: "chromadb",
      vectorDimensions: 1536,
    },
    security: {
      sandboxMode: "wasm",
      allowedDomains: [],
      maxExecutionTime: 30000,
    },
    dashboard: {
      enabled: false,
      port: 3001,
      auth: true,
    },
  };

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    process.env.HOME = "/tmp/test-home";

    // Default mocks
    (existsSync as any).mockReturnValue(false);
    (readFileSync as any).mockReturnValue(JSON.stringify(mockTemplate));
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    delete process.env.HOME;
    vi.clearAllMocks();
  });

  describe("Fresh Installation", () => {
    it("should create config with Anthropic only", async () => {
      const inquirer = await import("inquirer");
      (inquirer.default.prompt as any)
        .mockResolvedValueOnce({
          useAnthropic: true,
          anthropicKey: "sk-ant-test123",
          useOpenAI: false,
          useGoogle: false,
          useOllama: false,
        })
        .mockResolvedValueOnce({
          enableRouter: true,
          routerStrategy: "cost-aware",
        })
        .mockResolvedValueOnce({
          enableDashboard: true,
          dashboardPort: 3001,
        });

      await initCommand();

      expect(writeFileSync).toHaveBeenCalledWith(
        "/tmp/test-home/.agentik-os/config.json",
        expect.stringContaining('"sk-ant-test123"')
      );
      // Success message is from ora spinner, not console.log
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Claude (Anthropic)"));
    });

    it("should create config with all models enabled", async () => {
      const inquirer = await import("inquirer");
      (inquirer.default.prompt as any)
        .mockResolvedValueOnce({
          useAnthropic: true,
          anthropicKey: "sk-ant-test123",
          useOpenAI: true,
          openaiKey: "sk-test456",
          useGoogle: true,
          googleKey: "google-key-789",
          useOllama: true,
          ollamaUrl: "http://localhost:11434",
        })
        .mockResolvedValueOnce({
          enableRouter: true,
          routerStrategy: "balanced",
        })
        .mockResolvedValueOnce({
          enableDashboard: true,
          dashboardPort: 3002,
        });

      await initCommand();

      const writtenConfig = (writeFileSync as any).mock.calls[0][1];
      const parsedConfig = JSON.parse(writtenConfig);

      expect(parsedConfig.models.anthropic.apiKey).toBe("sk-ant-test123");
      expect(parsedConfig.models.anthropic.enabled).toBe(true);
      expect(parsedConfig.models.openai.apiKey).toBe("sk-test456");
      expect(parsedConfig.models.openai.enabled).toBe(true);
      expect(parsedConfig.models.google.apiKey).toBe("google-key-789");
      expect(parsedConfig.models.google.enabled).toBe(true);
      expect(parsedConfig.models.ollama.baseUrl).toBe("http://localhost:11434");
      expect(parsedConfig.models.ollama.enabled).toBe(true);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Claude (Anthropic), GPT (OpenAI), Gemini (Google), Ollama (Local)")
      );
    });

    it("should create config directory if it doesn't exist", async () => {
      const inquirer = await import("inquirer");
      (existsSync as any).mockReturnValueOnce(false); // Config file doesn't exist
      (inquirer.default.prompt as any)
        .mockResolvedValueOnce({ useAnthropic: true, anthropicKey: "sk-ant-test", useOpenAI: false, useGoogle: false, useOllama: false })
        .mockResolvedValueOnce({ enableRouter: true, routerStrategy: "cost-aware" })
        .mockResolvedValueOnce({ enableDashboard: true, dashboardPort: 3001 });

      await initCommand();

      expect(mkdirSync).toHaveBeenCalledWith("/tmp/test-home/.agentik-os", { recursive: true });
    });

    it("should not create directory if it already exists", async () => {
      const inquirer = await import("inquirer");
      (existsSync as any)
        .mockReturnValueOnce(false) // Config file doesn't exist
        .mockReturnValueOnce(true); // Config dir exists (second call in init)

      (inquirer.default.prompt as any)
        .mockResolvedValueOnce({ useAnthropic: true, anthropicKey: "sk-ant-test", useOpenAI: false, useGoogle: false, useOllama: false })
        .mockResolvedValueOnce({ enableRouter: true })
        .mockResolvedValueOnce({ enableDashboard: true });

      await initCommand();

      expect(mkdirSync).not.toHaveBeenCalled();
    });
  });

  describe("Overwriting Existing Config", () => {
    it("should prompt to overwrite if config exists", async () => {
      const inquirer = await import("inquirer");
      (existsSync as any).mockReturnValue(true);
      (inquirer.default.prompt as any)
        .mockResolvedValueOnce({ overwrite: true })
        .mockResolvedValueOnce({ useAnthropic: true, anthropicKey: "sk-ant-new", useOpenAI: false, useGoogle: false, useOllama: false })
        .mockResolvedValueOnce({ enableRouter: false })
        .mockResolvedValueOnce({ enableDashboard: false });

      await initCommand();

      expect(inquirer.default.prompt).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            type: "confirm",
            name: "overwrite",
            message: expect.stringContaining("already exists"),
          }),
        ])
      );
      expect(writeFileSync).toHaveBeenCalled();
    });

    it("should exit without overwriting if user declines", async () => {
      const inquirer = await import("inquirer");
      (existsSync as any).mockReturnValue(true);
      (inquirer.default.prompt as any).mockResolvedValueOnce({ overwrite: false });

      await initCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Configuration unchanged"));
      expect(writeFileSync).not.toHaveBeenCalled();
    });
  });

  describe("Router Configuration", () => {
    it("should enable router with cost-aware strategy", async () => {
      const inquirer = await import("inquirer");
      (inquirer.default.prompt as any)
        .mockResolvedValueOnce({ useAnthropic: true, anthropicKey: "sk-ant-test", useOpenAI: false, useGoogle: false, useOllama: false })
        .mockResolvedValueOnce({ enableRouter: true, routerStrategy: "cost-aware" })
        .mockResolvedValueOnce({ enableDashboard: true });

      await initCommand();

      const writtenConfig = JSON.parse((writeFileSync as any).mock.calls[0][1]);
      expect(writtenConfig.router.enabled).toBe(true);
      expect(writtenConfig.router.strategy).toBe("cost-aware");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Router: Enabled (cost-aware)")
      );
    });

    it("should enable router with performance strategy", async () => {
      const inquirer = await import("inquirer");
      (inquirer.default.prompt as any)
        .mockResolvedValueOnce({ useAnthropic: true, anthropicKey: "sk-ant-test", useOpenAI: false, useGoogle: false, useOllama: false })
        .mockResolvedValueOnce({ enableRouter: true, routerStrategy: "performance" })
        .mockResolvedValueOnce({ enableDashboard: true });

      await initCommand();

      const writtenConfig = JSON.parse((writeFileSync as any).mock.calls[0][1]);
      expect(writtenConfig.router.strategy).toBe("performance");
    });

    it("should disable router when user declines", async () => {
      const inquirer = await import("inquirer");
      (inquirer.default.prompt as any)
        .mockResolvedValueOnce({ useAnthropic: true, anthropicKey: "sk-ant-test", useOpenAI: false, useGoogle: false, useOllama: false })
        .mockResolvedValueOnce({ enableRouter: false })
        .mockResolvedValueOnce({ enableDashboard: true });

      await initCommand();

      const writtenConfig = JSON.parse((writeFileSync as any).mock.calls[0][1]);
      expect(writtenConfig.router.enabled).toBe(false);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Router: Disabled")
      );
    });
  });

  describe("Dashboard Configuration", () => {
    it("should enable dashboard on default port", async () => {
      const inquirer = await import("inquirer");
      (inquirer.default.prompt as any)
        .mockResolvedValueOnce({ useAnthropic: true, anthropicKey: "sk-ant-test", useOpenAI: false, useGoogle: false, useOllama: false })
        .mockResolvedValueOnce({ enableRouter: true })
        .mockResolvedValueOnce({ enableDashboard: true, dashboardPort: 3001 });

      await initCommand();

      const writtenConfig = JSON.parse((writeFileSync as any).mock.calls[0][1]);
      expect(writtenConfig.dashboard.enabled).toBe(true);
      expect(writtenConfig.dashboard.port).toBe(3001);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Dashboard: Enabled (port 3001)")
      );
    });

    it("should enable dashboard on custom port", async () => {
      const inquirer = await import("inquirer");
      (inquirer.default.prompt as any)
        .mockResolvedValueOnce({ useAnthropic: true, anthropicKey: "sk-ant-test", useOpenAI: false, useGoogle: false, useOllama: false })
        .mockResolvedValueOnce({ enableRouter: true })
        .mockResolvedValueOnce({ enableDashboard: true, dashboardPort: 4000 });

      await initCommand();

      const writtenConfig = JSON.parse((writeFileSync as any).mock.calls[0][1]);
      expect(writtenConfig.dashboard.port).toBe(4000);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Dashboard: Enabled (port 4000)")
      );
    });

    it("should disable dashboard when user declines", async () => {
      const inquirer = await import("inquirer");
      (inquirer.default.prompt as any)
        .mockResolvedValueOnce({ useAnthropic: true, anthropicKey: "sk-ant-test", useOpenAI: false, useGoogle: false, useOllama: false })
        .mockResolvedValueOnce({ enableRouter: true })
        .mockResolvedValueOnce({ enableDashboard: false });

      await initCommand();

      const writtenConfig = JSON.parse((writeFileSync as any).mock.calls[0][1]);
      expect(writtenConfig.dashboard.enabled).toBe(false);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Dashboard: Disabled")
      );
    });
  });

  describe("Model Selection", () => {
    it("should handle no models selected", async () => {
      const inquirer = await import("inquirer");
      (inquirer.default.prompt as any)
        .mockResolvedValueOnce({ useAnthropic: false, useOpenAI: false, useGoogle: false, useOllama: false })
        .mockResolvedValueOnce({ enableRouter: true })
        .mockResolvedValueOnce({ enableDashboard: true });

      await initCommand();

      const writtenConfig = JSON.parse((writeFileSync as any).mock.calls[0][1]);
      expect(writtenConfig.models.anthropic.enabled).toBe(false);
      expect(writtenConfig.models.openai.enabled).toBe(false);
      expect(writtenConfig.models.google.enabled).toBe(false);
      expect(writtenConfig.models.ollama.enabled).toBe(false);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Models: None")
      );
    });

    it("should handle OpenAI only", async () => {
      const inquirer = await import("inquirer");
      (inquirer.default.prompt as any)
        .mockResolvedValueOnce({
          useAnthropic: false,
          useOpenAI: true,
          openaiKey: "sk-openai123",
          useGoogle: false,
          useOllama: false,
        })
        .mockResolvedValueOnce({ enableRouter: true })
        .mockResolvedValueOnce({ enableDashboard: true });

      await initCommand();

      const writtenConfig = JSON.parse((writeFileSync as any).mock.calls[0][1]);
      expect(writtenConfig.models.openai.apiKey).toBe("sk-openai123");
      expect(writtenConfig.models.openai.enabled).toBe(true);
      expect(writtenConfig.models.anthropic.enabled).toBe(false);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("GPT (OpenAI)")
      );
    });

    it("should handle Google only", async () => {
      const inquirer = await import("inquirer");
      (inquirer.default.prompt as any)
        .mockResolvedValueOnce({
          useAnthropic: false,
          useOpenAI: false,
          useGoogle: true,
          googleKey: "google-key-123",
          useOllama: false,
        })
        .mockResolvedValueOnce({ enableRouter: true })
        .mockResolvedValueOnce({ enableDashboard: true });

      await initCommand();

      const writtenConfig = JSON.parse((writeFileSync as any).mock.calls[0][1]);
      expect(writtenConfig.models.google.apiKey).toBe("google-key-123");
      expect(writtenConfig.models.google.enabled).toBe(true);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Gemini (Google)")
      );
    });

    it("should handle Ollama only with custom URL", async () => {
      const inquirer = await import("inquirer");
      (inquirer.default.prompt as any)
        .mockResolvedValueOnce({
          useAnthropic: false,
          useOpenAI: false,
          useGoogle: false,
          useOllama: true,
          ollamaUrl: "http://custom-ollama:8080",
        })
        .mockResolvedValueOnce({ enableRouter: true })
        .mockResolvedValueOnce({ enableDashboard: true });

      await initCommand();

      const writtenConfig = JSON.parse((writeFileSync as any).mock.calls[0][1]);
      expect(writtenConfig.models.ollama.baseUrl).toBe("http://custom-ollama:8080");
      expect(writtenConfig.models.ollama.enabled).toBe(true);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Ollama (Local)")
      );
    });
  });

  describe("Output Messages", () => {
    it("should display welcome message", async () => {
      const inquirer = await import("inquirer");
      (inquirer.default.prompt as any)
        .mockResolvedValueOnce({ useAnthropic: true, anthropicKey: "sk-ant-test", useOpenAI: false, useGoogle: false, useOllama: false })
        .mockResolvedValueOnce({ enableRouter: true })
        .mockResolvedValueOnce({ enableDashboard: true });

      await initCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("🐼 Agentik OS - Configuration Setup")
      );
    });

    it("should display next steps", async () => {
      const inquirer = await import("inquirer");
      (inquirer.default.prompt as any)
        .mockResolvedValueOnce({ useAnthropic: true, anthropicKey: "sk-ant-test", useOpenAI: false, useGoogle: false, useOllama: false })
        .mockResolvedValueOnce({ enableRouter: true })
        .mockResolvedValueOnce({ enableDashboard: true });

      await initCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("🚀 Next steps:"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("panda agent create"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("panda chat"));
    });

    it("should display config location in summary", async () => {
      const inquirer = await import("inquirer");
      (inquirer.default.prompt as any)
        .mockResolvedValueOnce({ useAnthropic: true, anthropicKey: "sk-ant-test", useOpenAI: false, useGoogle: false, useOllama: false })
        .mockResolvedValueOnce({ enableRouter: true })
        .mockResolvedValueOnce({ enableDashboard: true });

      await initCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Location: /tmp/test-home/.agentik-os/config.json")
      );
    });
  });

  describe("Edge Cases", () => {
    it("should handle undefined router answers gracefully", async () => {
      const inquirer = await import("inquirer");
      (inquirer.default.prompt as any)
        .mockResolvedValueOnce({ useAnthropic: true, anthropicKey: "sk-ant-test", useOpenAI: false, useGoogle: false, useOllama: false })
        .mockResolvedValueOnce({}) // Empty answers for router
        .mockResolvedValueOnce({ enableDashboard: true });

      await initCommand();

      const writtenConfig = JSON.parse((writeFileSync as any).mock.calls[0][1]);
      expect(writtenConfig.router.enabled).toBe(true); // Default
      expect(writtenConfig.router.strategy).toBe("cost-aware"); // Default
    });

    it("should handle undefined dashboard answers gracefully", async () => {
      const inquirer = await import("inquirer");
      (inquirer.default.prompt as any)
        .mockResolvedValueOnce({ useAnthropic: true, anthropicKey: "sk-ant-test", useOpenAI: false, useGoogle: false, useOllama: false })
        .mockResolvedValueOnce({ enableRouter: true })
        .mockResolvedValueOnce({}); // Empty answers for dashboard

      await initCommand();

      const writtenConfig = JSON.parse((writeFileSync as any).mock.calls[0][1]);
      expect(writtenConfig.dashboard.enabled).toBe(true); // Default
      expect(writtenConfig.dashboard.port).toBe(3001); // Default
    });

    it("should use HOME environment variable for config path", async () => {
      const inquirer = await import("inquirer");
      process.env.HOME = "/custom/home";

      (inquirer.default.prompt as any)
        .mockResolvedValueOnce({ useAnthropic: true, anthropicKey: "sk-ant-test", useOpenAI: false, useGoogle: false, useOllama: false })
        .mockResolvedValueOnce({ enableRouter: true })
        .mockResolvedValueOnce({ enableDashboard: true });

      await initCommand();

      expect(writeFileSync).toHaveBeenCalledWith(
        "/custom/home/.agentik-os/config.json",
        expect.any(String)
      );
    });
  });
});
