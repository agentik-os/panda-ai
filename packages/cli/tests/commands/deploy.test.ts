import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { deployDockerCommand, deployK8sCommand, deployStatusCommand } from "../../src/commands/deploy";

// Mock dependencies
vi.mock("chalk", () => ({
  default: {
    cyan: { bold: (str: string) => str },
    green: (str: string) => str,
    yellow: (str: string) => str,
    dim: (str: string) => str,
    bold: (str: string) => str,
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

describe("Deploy Commands", () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    vi.clearAllMocks();
  });

  describe("deployDockerCommand", () => {
    it("should generate Docker configuration with default options", async () => {
      await deployDockerCommand();

      // Verify console outputs
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("🐳 Docker Deployment"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Docker deployment files created"));

      // Verify file paths shown
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("docker-compose.yml"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Dockerfile"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(".env.example"));

      // Verify next steps shown
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Next Steps"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("docker-compose build"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("docker-compose up -d"));
    });

    it("should use custom output directory when provided", async () => {
      await deployDockerCommand({ output: "./custom-deploy" });

      // Verify custom output directory is used
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("./custom-deploy"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("docker-compose.yml"));
    });

    it("should handle production environment flag", async () => {
      await deployDockerCommand({ prod: true });

      // Should complete without errors (env var is set internally)
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Docker deployment files created"));
    });

    it("should handle development environment by default", async () => {
      await deployDockerCommand({ prod: false });

      // Should complete without errors
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Docker deployment files created"));
    });

    it("should handle no options", async () => {
      await deployDockerCommand();

      // Should use defaults: ./deploy directory, development env
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("./deploy"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Docker deployment files created"));
    });

    it("should complete within reasonable time", async () => {
      const startTime = Date.now();
      await deployDockerCommand();
      const duration = Date.now() - startTime;

      // Should complete in ~1.5 seconds (simulated delay)
      expect(duration).toBeGreaterThan(1400);
      expect(duration).toBeLessThan(2000);
    });

    it("should display all required Docker files", async () => {
      await deployDockerCommand();

      const requiredFiles = [
        "docker-compose.yml",
        "Dockerfile",
        ".env.example",
      ];

      requiredFiles.forEach((file) => {
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(file));
      });
    });

    it("should show Docker commands in next steps", async () => {
      await deployDockerCommand();

      const expectedCommands = [
        "docker-compose build",
        "docker-compose up -d",
        "docker-compose logs -f",
      ];

      expectedCommands.forEach((cmd) => {
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(cmd));
      });
    });
  });

  describe("deployK8sCommand", () => {
    it("should generate Kubernetes manifests with default options", async () => {
      await deployK8sCommand();

      // Verify console outputs
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("☸️  Kubernetes Deployment"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Kubernetes deployment files created"));

      // Verify default namespace
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("agentik-os"));
    });

    it("should use custom namespace when provided", async () => {
      await deployK8sCommand({ namespace: "custom-namespace" });

      // Verify custom namespace is used
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("custom-namespace"));
    });

    it("should use custom output directory when provided", async () => {
      await deployK8sCommand({ output: "./k8s-custom" });

      // Should complete without errors
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Kubernetes deployment files created"));
    });

    it("should handle no options", async () => {
      await deployK8sCommand();

      // Should use default namespace: agentik-os
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("agentik-os"));
    });

    it("should complete within reasonable time", async () => {
      const startTime = Date.now();
      await deployK8sCommand();
      const duration = Date.now() - startTime;

      // Should complete in ~2 seconds (simulated delay)
      expect(duration).toBeGreaterThan(1900);
      expect(duration).toBeLessThan(2500);
    });

    it("should display all required Kubernetes files", async () => {
      await deployK8sCommand();

      const requiredFiles = [
        "namespace.yaml",
        "deployment-runtime.yaml",
        "deployment-dashboard.yaml",
        "service-runtime.yaml",
        "service-dashboard.yaml",
        "ingress.yaml",
        "configmap.yaml",
        "secrets.yaml.example",
      ];

      requiredFiles.forEach((file) => {
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(file));
      });
    });

    it("should show kubectl commands in next steps", async () => {
      await deployK8sCommand();

      const expectedCommands = [
        "kubectl apply -f k8s/namespace.yaml",
        "kubectl apply -f k8s/secrets.yaml",
        "kubectl apply -f k8s/",
        "kubectl get pods",
      ];

      expectedCommands.forEach((cmd) => {
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(cmd));
      });
    });

    it("should include namespace in kubectl get pods command", async () => {
      const namespace = "production";
      await deployK8sCommand({ namespace });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(`kubectl get pods -n ${namespace}`)
      );
    });

    it("should show secrets copy instruction", async () => {
      await deployK8sCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("secrets.yaml.example to secrets.yaml")
      );
    });
  });

  describe("deployStatusCommand", () => {
    it("should show deployment status", async () => {
      await deployStatusCommand();

      // Verify console outputs
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("🚀 Deployment Status"));
      // Status loaded is from spinner, not console.log
    });

    it("should show Docker status", async () => {
      await deployStatusCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("🐳 Docker"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Not detected"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("panda deploy docker"));
    });

    it("should show Kubernetes status", async () => {
      await deployStatusCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("☸️  Kubernetes"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Not detected"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("panda deploy k8s"));
    });

    it("should show services status", async () => {
      await deployStatusCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("🌐 Services"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Runtime"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Dashboard"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Running"));
    });

    it("should show service ports", async () => {
      await deployStatusCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("localhost:3000"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("localhost:3001"));
    });

    it("should show dependencies status", async () => {
      await deployStatusCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("🔧 Dependencies"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("PostgreSQL"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Redis"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Connected"));
    });

    it("should complete within reasonable time", async () => {
      const startTime = Date.now();
      await deployStatusCommand();
      const duration = Date.now() - startTime;

      // Should complete in ~1.5 seconds (simulated delay)
      expect(duration).toBeGreaterThan(1400);
      expect(duration).toBeLessThan(2000);
    });

    it("should show all status sections", async () => {
      await deployStatusCommand();

      const requiredSections = [
        "🐳 Docker",
        "☸️  Kubernetes",
        "🌐 Services",
        "🔧 Dependencies",
      ];

      requiredSections.forEach((section) => {
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(section));
      });
    });

    it("should provide deployment suggestions", async () => {
      await deployStatusCommand();

      // Should suggest deployment commands for undetected platforms
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("panda deploy docker"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("panda deploy k8s"));
    });
  });

  describe("Integration Tests", () => {
    it("should allow running all deploy commands in sequence", async () => {
      // Should be able to run all commands without conflicts
      await deployDockerCommand();
      await deployK8sCommand();
      await deployStatusCommand();

      // All commands should have completed
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Docker deployment files created"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Kubernetes deployment files created"));
      // All three completed successfully
    }, 10000); // Increase timeout to 10 seconds

    it("should handle concurrent command execution", async () => {
      // Run multiple commands concurrently
      await Promise.all([
        deployDockerCommand(),
        deployK8sCommand(),
        deployStatusCommand(),
      ]);

      // All should complete successfully
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("should handle undefined options gracefully", async () => {
      // All commands should handle undefined options
      await expect(deployDockerCommand(undefined)).resolves.not.toThrow();
      await expect(deployK8sCommand(undefined)).resolves.not.toThrow();
    });

    it("should handle empty options object", async () => {
      await expect(deployDockerCommand({})).resolves.not.toThrow();
      await expect(deployK8sCommand({})).resolves.not.toThrow();
    });

    it("should handle partial options", async () => {
      await expect(deployDockerCommand({ output: "./deploy" })).resolves.not.toThrow();
      await expect(deployDockerCommand({ prod: true })).resolves.not.toThrow();
      await expect(deployK8sCommand({ namespace: "test" })).resolves.not.toThrow();
      await expect(deployK8sCommand({ output: "./k8s" })).resolves.not.toThrow();
    }, 10000); // Increase timeout to 10 seconds
  });
});
