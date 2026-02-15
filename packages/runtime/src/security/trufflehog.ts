/**
 * TruffleHog Secret Detection Integration
 *
 * Scans git repositories and filesystems for exposed secrets:
 * - API keys (AWS, GitHub, Stripe, etc.)
 * - Passwords and tokens
 * - Private keys and certificates
 * - Database credentials
 * - OAuth tokens
 *
 * Uses pattern matching and entropy detection to find secrets
 * in code, config files, commit history, and artifacts.
 *
 * @packageDocumentation
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface TruffleHogConfig {
  /**
   * Path to TruffleHog binary
   * @default "trufflehog"
   */
  trufflehogPath?: string;

  /**
   * Scan timeout in milliseconds
   * @default 600000 (10 minutes)
   */
  timeout?: number;

  /**
   * Maximum depth for git history scanning
   * @default 100
   */
  maxDepth?: number;

  /**
   * Enable entropy detection
   * @default true
   */
  entropyDetection?: boolean;

  /**
   * Verify found secrets against live services
   * @default false
   */
  verifySecrets?: boolean;

  /**
   * Output format
   * @default "json"
   */
  format?: "json" | "text";
}

export type SecretSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export interface TruffleHogSecret {
  /**
   * Type of secret detected (e.g., "AWS Access Key", "GitHub Token")
   */
  type: string;

  /**
   * Detector that found the secret
   */
  detector: string;

  /**
   * Severity level
   */
  severity: SecretSeverity;

  /**
   * File path where secret was found
   */
  file: string;

  /**
   * Line number
   */
  line: number;

  /**
   * Git commit hash (if applicable)
   */
  commit?: string;

  /**
   * Commit author (if applicable)
   */
  author?: string;

  /**
   * Commit date (if applicable)
   */
  date?: string;

  /**
   * Secret value (redacted)
   */
  secret: string;

  /**
   * Whether secret was verified as active
   */
  verified?: boolean;

  /**
   * Verification details
   */
  verificationDetails?: string;

  /**
   * Entropy score (0-8, higher = more random)
   */
  entropy?: number;
}

export interface TruffleHogScanResult {
  /**
   * Scan success status
   */
  success: boolean;

  /**
   * Target scanned (repo URL or directory)
   */
  target: string;

  /**
   * Total secrets found
   */
  totalSecrets: number;

  /**
   * Secrets by severity
   */
  bySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };

  /**
   * Secrets by type
   */
  byType: Record<string, number>;

  /**
   * List of all secrets found
   */
  secrets: TruffleHogSecret[];

  /**
   * Scan duration in milliseconds
   */
  duration: number;

  /**
   * Scan timestamp
   */
  timestamp: Date;

  /**
   * Error message if scan failed
   */
  error?: string;
}

/**
 * TruffleHog secret scanner
 */
export class TruffleHogScanner {
  private config: Required<TruffleHogConfig>;

  constructor(config: TruffleHogConfig = {}) {
    this.config = {
      trufflehogPath: config.trufflehogPath || "trufflehog",
      timeout: config.timeout || 600000,
      maxDepth: config.maxDepth || 100,
      entropyDetection: config.entropyDetection ?? true,
      verifySecrets: config.verifySecrets ?? false,
      format: config.format || "json",
    };
  }

  /**
   * Check if TruffleHog is installed
   */
  async isInstalled(): Promise<boolean> {
    try {
      const { stdout } = await execFileAsync(this.config.trufflehogPath, ["--version"], {
        timeout: 5000,
      });
      return stdout.includes("trufflehog");
    } catch {
      return false;
    }
  }

  /**
   * Get TruffleHog version
   */
  async getVersion(): Promise<string> {
    try {
      const { stdout } = await execFileAsync(this.config.trufflehogPath, ["--version"]);
      const match = stdout.match(/trufflehog\s+([0-9.]+)/i);
      return match?.[1] || "unknown";
    } catch (error) {
      throw new Error(`Failed to get TruffleHog version: ${String(error)}`);
    }
  }

  /**
   * Scan a git repository
   */
  async scanGitRepo(repoPath: string): Promise<TruffleHogScanResult> {
    const startTime = Date.now();
    const timestamp = new Date();

    try {
      if (!(await this.isInstalled())) {
        return {
          success: false,
          target: repoPath,
          totalSecrets: 0,
          bySeverity: { critical: 0, high: 0, medium: 0, low: 0 },
          byType: {},
          secrets: [],
          duration: Date.now() - startTime,
          timestamp,
          error: "TruffleHog not installed. Install: https://github.com/trufflesecurity/trufflehog",
        };
      }

      // Build command args
      const args = [
        "filesystem",
        "--directory",
        repoPath,
        "--json",
        "--max-depth",
        String(this.config.maxDepth),
      ];

      if (!this.config.entropyDetection) {
        args.push("--no-entropy");
      }

      if (this.config.verifySecrets) {
        args.push("--verify");
      }

      // Run scan
      let stdout = "";
      try {
        const result = await execFileAsync(this.config.trufflehogPath, args, {
          timeout: this.config.timeout,
          maxBuffer: 50 * 1024 * 1024, // 50MB buffer for large outputs
        });
        stdout = result.stdout;
      } catch (error: any) {
        // TruffleHog returns exit code 183 if secrets found (expected)
        if (error.code === 183 && error.stdout) {
          stdout = error.stdout;
        } else if (!String(error).includes("exit code 183")) {
          throw error;
        }
      }

      // Parse results (one JSON object per line)
      const secrets: TruffleHogSecret[] = [];
      const lines = stdout.split("\n").filter((line) => line.trim());

      for (const line of lines) {
        try {
          const finding = JSON.parse(line);

          if (finding.DetectorName && finding.Raw) {
            secrets.push({
              type: finding.DetectorName,
              detector: finding.DetectorName,
              severity: this.mapSeverity(finding),
              file: finding.SourceMetadata?.Data?.Filesystem?.file || "unknown",
              line: finding.SourceMetadata?.Data?.Filesystem?.line || 0,
              commit: finding.SourceMetadata?.Data?.Git?.commit,
              author: finding.SourceMetadata?.Data?.Git?.author,
              date: finding.SourceMetadata?.Data?.Git?.date,
              secret: this.redactSecret(finding.Raw),
              verified: finding.Verified,
              verificationDetails: finding.ExtraData?.verification_details,
              entropy: finding.RawV2?.[0]?.entropy,
            });
          }
        } catch (parseError) {
          // Skip malformed lines
          console.warn(`Failed to parse TruffleHog output line: ${parseError}`);
        }
      }

      // Count by severity
      const bySeverity = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      };

      for (const secret of secrets) {
        const severityKey = secret.severity.toLowerCase() as keyof typeof bySeverity;
        if (severityKey in bySeverity) {
          bySeverity[severityKey]++;
        }
      }

      // Count by type
      const byType: Record<string, number> = {};
      for (const secret of secrets) {
        byType[secret.type] = (byType[secret.type] || 0) + 1;
      }

      return {
        success: true,
        target: repoPath,
        totalSecrets: secrets.length,
        bySeverity,
        byType,
        secrets,
        duration: Date.now() - startTime,
        timestamp,
      };
    } catch (error) {
      return {
        success: false,
        target: repoPath,
        totalSecrets: 0,
        bySeverity: { critical: 0, high: 0, medium: 0, low: 0 },
        byType: {},
        secrets: [],
        duration: Date.now() - startTime,
        timestamp,
        error: String(error),
      };
    }
  }

  /**
   * Scan a filesystem directory
   */
  async scanFilesystem(dirPath: string): Promise<TruffleHogScanResult> {
    return this.scanGitRepo(dirPath); // Same implementation
  }

  /**
   * Scan a skill package
   */
  async scanSkill(skillPath: string): Promise<TruffleHogScanResult> {
    return this.scanFilesystem(skillPath);
  }

  /**
   * Map TruffleHog finding to severity level
   */
  private mapSeverity(finding: any): SecretSeverity {
    // Verified secrets are critical
    if (finding.Verified) {
      return "CRITICAL";
    }

    // Check detector type
    const detector = finding.DetectorName?.toLowerCase() || "";

    // Production API keys are critical
    if (
      detector.includes("aws") ||
      detector.includes("stripe") ||
      detector.includes("github") ||
      detector.includes("google") ||
      detector.includes("azure")
    ) {
      return "HIGH";
    }

    // Private keys and certificates are high
    if (
      detector.includes("private") ||
      detector.includes("key") ||
      detector.includes("cert")
    ) {
      return "HIGH";
    }

    // Passwords and tokens
    if (detector.includes("password") || detector.includes("token")) {
      return "MEDIUM";
    }

    // Default to medium for unknown types
    return "MEDIUM";
  }

  /**
   * Redact secret value for safe logging
   */
  private redactSecret(secret: string): string {
    if (secret.length <= 8) {
      return "***REDACTED***";
    }

    // Show first 4 and last 4 characters
    const prefix = secret.slice(0, 4);
    const suffix = secret.slice(-4);
    return `${prefix}***${suffix}`;
  }

  /**
   * Generate security report
   */
  generateReport(result: TruffleHogScanResult): string {
    const { target, totalSecrets, bySeverity, byType, duration } = result;

    let report = "TruffleHog Secret Scan Report\n";
    report += "==============================\n\n";

    if (!result.success) {
      report += `❌ Scan failed: ${result.error}\n`;
      return report;
    }

    report += `Target: ${target}\n`;
    report += `Total secrets found: ${totalSecrets}\n`;
    report += `Scan duration: ${(duration / 1000).toFixed(2)}s\n\n`;

    if (totalSecrets === 0) {
      report += "✅ No secrets detected!\n";
      return report;
    }

    report += "By Severity:\n";
    report += `  Critical: ${bySeverity.critical}\n`;
    report += `  High:     ${bySeverity.high}\n`;
    report += `  Medium:   ${bySeverity.medium}\n`;
    report += `  Low:      ${bySeverity.low}\n\n`;

    report += "By Type:\n";
    for (const [type, count] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
      report += `  ${type}: ${count}\n`;
    }

    report += "\nTop Secrets:\n";
    const top10 = result.secrets.slice(0, 10);
    for (const secret of top10) {
      report += `\n${secret.severity}: ${secret.type}\n`;
      report += `  File: ${secret.file}:${secret.line}\n`;
      report += `  Value: ${secret.secret}\n`;
      if (secret.verified) {
        report += `  ⚠️ VERIFIED: This secret is ACTIVE!\n`;
      }
      if (secret.commit) {
        report += `  Commit: ${secret.commit} by ${secret.author}\n`;
      }
    }

    return report;
  }
}

/**
 * Quick scan helper
 */
export async function scanForSecrets(
  path: string,
  config?: TruffleHogConfig
): Promise<TruffleHogScanResult> {
  const scanner = new TruffleHogScanner(config);
  return scanner.scanFilesystem(path);
}
