/**
 * Gitleaks Secret Detection Integration
 *
 * Scans git repositories for hardcoded secrets and credentials:
 * - API keys and tokens
 * - Passwords and private keys
 * - AWS, GCP, Azure credentials
 * - Database connection strings
 * - OAuth tokens and secrets
 *
 * Gitleaks uses regex patterns and entropy detection to find secrets
 * in git history, branches, and uncommitted changes.
 *
 * @packageDocumentation
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface GitleaksConfig {
  /**
   * Path to Gitleaks binary
   * @default "gitleaks"
   */
  gitleaksPath?: string;

  /**
   * Scan timeout in milliseconds
   * @default 600000 (10 minutes)
   */
  timeout?: number;

  /**
   * Path to custom config file
   */
  configPath?: string;

  /**
   * Enable verbose output
   * @default false
   */
  verbose?: boolean;

  /**
   * Scan uncommitted changes only
   * @default false
   */
  uncommittedOnly?: boolean;
}

export type GitleaksSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export interface GitleaksSecret {
  /**
   * Rule that detected the secret
   */
  rule: string;

  /**
   * Description of the secret type
   */
  description: string;

  /**
   * Severity level
   */
  severity: GitleaksSeverity;

  /**
   * File path where secret was found
   */
  file: string;

  /**
   * Line number
   */
  line: number;

  /**
   * Git commit hash
   */
  commit?: string;

  /**
   * Commit author
   */
  author?: string;

  /**
   * Commit date
   */
  date?: string;

  /**
   * Secret value (redacted)
   */
  secret: string;

  /**
   * Match text
   */
  match: string;

  /**
   * Start index in line
   */
  startIndex?: number;

  /**
   * End index in line
   */
  endIndex?: number;

  /**
   * Entropy score
   */
  entropy?: number;

  /**
   * Fingerprint (hash of the finding)
   */
  fingerprint?: string;
}

export interface GitleaksScanResult {
  /**
   * Scan success status
   */
  success: boolean;

  /**
   * Target scanned (repo path)
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
   * Secrets by rule
   */
  byRule: Record<string, number>;

  /**
   * List of all secrets found
   */
  secrets: GitleaksSecret[];

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
 * Gitleaks secret scanner
 */
export class GitleaksScanner {
  private config: Required<Omit<GitleaksConfig, "configPath">> & {
    configPath?: string;
  };

  constructor(config: GitleaksConfig = {}) {
    this.config = {
      gitleaksPath: config.gitleaksPath || "gitleaks",
      timeout: config.timeout || 600000,
      verbose: config.verbose ?? false,
      uncommittedOnly: config.uncommittedOnly ?? false,
      configPath: config.configPath,
    };
  }

  /**
   * Check if Gitleaks is installed
   */
  async isInstalled(): Promise<boolean> {
    try {
      const { stdout } = await execFileAsync(this.config.gitleaksPath, ["version"], {
        timeout: 5000,
      });
      return stdout.includes("gitleaks version");
    } catch {
      return false;
    }
  }

  /**
   * Get Gitleaks version
   */
  async getVersion(): Promise<string> {
    try {
      const { stdout } = await execFileAsync(this.config.gitleaksPath, ["version"]);
      const match = stdout.match(/([0-9]+\.[0-9]+\.[0-9]+)/);
      return match?.[1] || "unknown";
    } catch (error) {
      throw new Error(`Failed to get Gitleaks version: ${String(error)}`);
    }
  }

  /**
   * Scan a git repository
   */
  async scanRepo(repoPath: string): Promise<GitleaksScanResult> {
    const startTime = Date.now();
    const timestamp = new Date();

    try {
      if (!(await this.isInstalled())) {
        return {
          success: false,
          target: repoPath,
          totalSecrets: 0,
          bySeverity: { critical: 0, high: 0, medium: 0, low: 0 },
          byRule: {},
          secrets: [],
          duration: Date.now() - startTime,
          timestamp,
          error: "Gitleaks not installed. Install: https://github.com/gitleaks/gitleaks",
        };
      }

      // Build command args
      const args = ["detect", "--source", repoPath, "--report-format", "json", "--report-path", "/dev/stdout"];

      if (this.config.configPath) {
        args.push("--config", this.config.configPath);
      }

      if (this.config.verbose) {
        args.push("--verbose");
      }

      if (this.config.uncommittedOnly) {
        args.push("--uncommitted");
      }

      // Run scan
      let stdout = "";
      try {
        const result = await execFileAsync(this.config.gitleaksPath, args, {
          timeout: this.config.timeout,
          maxBuffer: 50 * 1024 * 1024, // 50MB buffer
        });
        stdout = result.stdout;
      } catch (error: any) {
        // Gitleaks returns exit code 1 if secrets found (expected)
        if (error.code === 1 && error.stdout) {
          stdout = error.stdout;
        } else if (!String(error).includes("exit code 1")) {
          throw error;
        }
      }

      // Parse results
      const secrets: GitleaksSecret[] = [];

      if (stdout.trim()) {
        try {
          const findings = JSON.parse(stdout);

          for (const finding of findings) {
            secrets.push({
              rule: finding.RuleID || "unknown",
              description: finding.Description || finding.RuleID || "Secret detected",
              severity: this.mapSeverity(finding),
              file: finding.File || "unknown",
              line: finding.StartLine || 0,
              commit: finding.Commit,
              author: finding.Author,
              date: finding.Date,
              secret: this.redactSecret(finding.Secret || finding.Match),
              match: finding.Match || "",
              startIndex: finding.StartColumn,
              endIndex: finding.EndColumn,
              entropy: finding.Entropy,
              fingerprint: finding.Fingerprint,
            });
          }
        } catch (parseError) {
          console.warn(`Failed to parse Gitleaks output: ${parseError}`);
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

      // Count by rule
      const byRule: Record<string, number> = {};
      for (const secret of secrets) {
        byRule[secret.rule] = (byRule[secret.rule] || 0) + 1;
      }

      return {
        success: true,
        target: repoPath,
        totalSecrets: secrets.length,
        bySeverity,
        byRule,
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
        byRule: {},
        secrets: [],
        duration: Date.now() - startTime,
        timestamp,
        error: String(error),
      };
    }
  }

  /**
   * Scan uncommitted changes only
   */
  async scanUncommitted(repoPath: string): Promise<GitleaksScanResult> {
    const originalUncommittedOnly = this.config.uncommittedOnly;
    this.config.uncommittedOnly = true;
    const result = await this.scanRepo(repoPath);
    this.config.uncommittedOnly = originalUncommittedOnly;
    return result;
  }

  /**
   * Scan a skill package
   */
  async scanSkill(skillPath: string): Promise<GitleaksScanResult> {
    return this.scanRepo(skillPath);
  }

  /**
   * Map finding to severity level
   */
  private mapSeverity(finding: any): GitleaksSeverity {
    const rule = finding.RuleID?.toLowerCase() || "";
    const description = finding.Description?.toLowerCase() || "";

    // Critical: Production cloud provider credentials
    if (
      rule.includes("aws") ||
      rule.includes("azure") ||
      rule.includes("gcp") ||
      rule.includes("google") ||
      rule.includes("stripe-api-key") ||
      rule.includes("sendgrid")
    ) {
      return "CRITICAL";
    }

    // High: API keys, tokens, private keys
    if (
      rule.includes("api-key") ||
      rule.includes("secret-key") ||
      rule.includes("private-key") ||
      rule.includes("github") ||
      rule.includes("token") ||
      description.includes("private key")
    ) {
      return "HIGH";
    }

    // Medium: Passwords, generic secrets
    if (rule.includes("password") || rule.includes("generic")) {
      return "MEDIUM";
    }

    // Default to medium
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
  generateReport(result: GitleaksScanResult): string {
    const { target, totalSecrets, bySeverity, byRule, duration } = result;

    let report = "Gitleaks Secret Scan Report\n";
    report += "============================\n\n";

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

    report += "By Rule:\n";
    for (const [rule, count] of Object.entries(byRule).sort((a, b) => b[1] - a[1])) {
      report += `  ${rule}: ${count}\n`;
    }

    report += "\nTop Secrets:\n";
    const top10 = result.secrets.slice(0, 10);
    for (const secret of top10) {
      report += `\n${secret.severity}: ${secret.rule}\n`;
      report += `  ${secret.description}\n`;
      report += `  File: ${secret.file}:${secret.line}\n`;
      report += `  Value: ${secret.secret}\n`;
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
export async function scanWithGitleaks(
  repoPath: string,
  config?: GitleaksConfig
): Promise<GitleaksScanResult> {
  const scanner = new GitleaksScanner(config);
  return scanner.scanRepo(repoPath);
}
