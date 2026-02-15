/**
 * CodeQL Integration for Advanced Code Scanning
 *
 * Integrates GitHub CodeQL to detect:
 * - SQL injection vulnerabilities
 * - Cross-site scripting (XSS)
 * - Path traversal attacks
 * - Cryptographic misuse
 * - Insecure randomness
 * - Command injection
 *
 * @packageDocumentation
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import * as fs from "node:fs/promises";
import * as path from "node:path";

const execFileAsync = promisify(execFile);

export interface CodeQLConfig {
  /**
   * Path to CodeQL CLI binary
   * @default "codeql"
   */
  codeqlPath?: string;

  /**
   * Languages to scan
   * @default ["javascript", "typescript"]
   */
  languages?: string[];

  /**
   * Query suites to run
   * @default ["security-and-quality"]
   */
  querySuites?: string[];

  /**
   * Maximum threads for parallel analysis
   * @default 0 (auto-detect)
   */
  threads?: number;

  /**
   * Timeout in milliseconds
   * @default 300000 (5 minutes)
   */
  timeout?: number;
}

export interface CodeQLVulnerability {
  /**
   * Unique vulnerability ID
   */
  id: string;

  /**
   * Vulnerability name/type
   */
  name: string;

  /**
   * Severity level
   */
  severity: "critical" | "high" | "medium" | "low" | "note";

  /**
   * CWE identifier (e.g., "CWE-89" for SQL injection)
   */
  cwe?: string;

  /**
   * CVSS score (0-10)
   */
  cvssScore?: number;

  /**
   * File path where vulnerability was found
   */
  file: string;

  /**
   * Line number
   */
  line: number;

  /**
   * Column number
   */
  column?: number;

  /**
   * Description of the vulnerability
   */
  description: string;

  /**
   * Remediation advice
   */
  remediation?: string;

  /**
   * Code snippet
   */
  snippet?: string;
}

export interface CodeQLScanResult {
  /**
   * Scan success status
   */
  success: boolean;

  /**
   * Total vulnerabilities found
   */
  totalVulnerabilities: number;

  /**
   * Vulnerabilities by severity
   */
  bySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    note: number;
  };

  /**
   * List of all vulnerabilities
   */
  vulnerabilities: CodeQLVulnerability[];

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
 * CodeQL scanner for detecting security vulnerabilities in code
 */
export class CodeQLScanner {
  private config: Required<CodeQLConfig>;

  constructor(config: CodeQLConfig = {}) {
    this.config = {
      codeqlPath: config.codeqlPath || "codeql",
      languages: config.languages || ["javascript", "typescript"],
      querySuites: config.querySuites || ["security-and-quality"],
      threads: config.threads || 0,
      timeout: config.timeout || 300000,
    };
  }

  /**
   * Check if CodeQL is installed and accessible
   */
  async isInstalled(): Promise<boolean> {
    try {
      const { stdout } = await execFileAsync(this.config.codeqlPath, ["version"], {
        timeout: 5000,
      });
      return stdout.includes("CodeQL");
    } catch {
      return false;
    }
  }

  /**
   * Get CodeQL version
   */
  async getVersion(): Promise<string> {
    try {
      const { stdout } = await execFileAsync(this.config.codeqlPath, ["version"]);
      const match = stdout.match(/CodeQL command-line toolchain release ([\d.]+)/);
      return match?.[1] || "unknown";
    } catch (error) {
      throw new Error(`Failed to get CodeQL version: ${String(error)}`);
    }
  }

  /**
   * Create CodeQL database for a directory
   */
  async createDatabase(
    sourceDir: string,
    language: string,
    dbPath: string
  ): Promise<void> {
    const args = [
      "database",
      "create",
      dbPath,
      `--language=${language}`,
      `--source-root=${sourceDir}`,
      "--overwrite",
    ];

    if (this.config.threads > 0) {
      args.push(`--threads=${this.config.threads}`);
    }

    try {
      await execFileAsync(this.config.codeqlPath, args, {
        timeout: this.config.timeout,
      });
    } catch (error) {
      throw new Error(`Failed to create CodeQL database: ${String(error)}`);
    }
  }

  /**
   * Run CodeQL analysis on a database
   */
  async analyzeDatabase(
    dbPath: string,
    outputPath: string,
    querySuite?: string
  ): Promise<void> {
    const suite = querySuite || this.config.querySuites[0] || "security-and-quality";
    const args = [
      "database",
      "analyze",
      dbPath,
      suite,
      `--format=sarif-latest`,
      `--output=${outputPath}`,
      "--no-download", // Don't download query packs automatically
    ];

    if (this.config.threads > 0) {
      args.push(`--threads=${this.config.threads}`);
    }

    try {
      await execFileAsync(this.config.codeqlPath, args, {
        timeout: this.config.timeout,
      });
    } catch (error) {
      throw new Error(`Failed to analyze database: ${String(error)}`);
    }
  }

  /**
   * Parse SARIF results file
   */
  private async parseSARIF(sarifPath: string): Promise<CodeQLVulnerability[]> {
    try {
      const sarifContent = await fs.readFile(sarifPath, "utf-8");
      const sarif = JSON.parse(sarifContent);

      const vulnerabilities: CodeQLVulnerability[] = [];

      for (const run of sarif.runs || []) {
        for (const result of run.results || []) {
          const rule = run.tool?.driver?.rules?.find(
            (r: { id: string }) => r.id === result.ruleId
          );

          const location = result.locations?.[0]?.physicalLocation;
          if (!location) continue;

          const vulnerability: CodeQLVulnerability = {
            id: result.ruleId || "unknown",
            name: rule?.name || result.message?.text || "Unknown vulnerability",
            severity: this.mapSeverity(result.level || rule?.properties?.["problem.severity"]),
            cwe: rule?.properties?.tags?.find((t: string) => t.startsWith("external/cwe/"))?.replace("external/cwe/cwe-", "CWE-"),
            cvssScore: rule?.properties?.["security-severity"]
              ? parseFloat(rule.properties["security-severity"])
              : undefined,
            file: location.artifactLocation?.uri || "unknown",
            line: location.region?.startLine || 0,
            column: location.region?.startColumn,
            description: result.message?.text || "No description",
            remediation: rule?.help?.text,
            snippet: location.region?.snippet?.text,
          };

          vulnerabilities.push(vulnerability);
        }
      }

      return vulnerabilities;
    } catch (error) {
      throw new Error(`Failed to parse SARIF file: ${String(error)}`);
    }
  }

  /**
   * Map CodeQL severity levels to our standard levels
   */
  private mapSeverity(
    level: string | undefined
  ): CodeQLVulnerability["severity"] {
    const levelLower = (level || "note").toLowerCase();
    if (levelLower.includes("error") || levelLower === "critical") return "critical";
    if (levelLower.includes("warning") || levelLower === "high") return "high";
    if (levelLower === "recommendation" || levelLower === "medium") return "medium";
    if (levelLower === "low") return "low";
    return "note";
  }

  /**
   * Scan a directory for vulnerabilities
   */
  async scan(sourceDir: string): Promise<CodeQLScanResult> {
    const startTime = Date.now();
    const timestamp = new Date();

    try {
      // Check if CodeQL is installed
      if (!(await this.isInstalled())) {
        return {
          success: false,
          totalVulnerabilities: 0,
          bySeverity: { critical: 0, high: 0, medium: 0, low: 0, note: 0 },
          vulnerabilities: [],
          duration: Date.now() - startTime,
          timestamp,
          error: "CodeQL not installed. Run: gh codeql version",
        };
      }

      // Create temp directory for databases and results
      const tempDir = await fs.mkdtemp(path.join("/tmp", "codeql-"));
      const dbPath = path.join(tempDir, "db");
      const sarifPath = path.join(tempDir, "results.sarif");

      let allVulnerabilities: CodeQLVulnerability[] = [];

      // Scan each language
      for (const language of this.config.languages) {
        const langDbPath = `${dbPath}-${language}`;

        try {
          // Create database
          await this.createDatabase(sourceDir, language, langDbPath);

          // Run analysis
          await this.analyzeDatabase(langDbPath, sarifPath);

          // Parse results
          const vulns = await this.parseSARIF(sarifPath);
          allVulnerabilities = allVulnerabilities.concat(vulns);

          // Clean up SARIF for next iteration
          await fs.unlink(sarifPath).catch(() => {});
        } catch (error) {
          console.warn(`Skipping ${language} scan: ${String(error)}`);
        }
      }

      // Count vulnerabilities by severity
      const bySeverity = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        note: 0,
      };

      for (const vuln of allVulnerabilities) {
        bySeverity[vuln.severity]++;
      }

      // Clean up temp directory
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});

      return {
        success: true,
        totalVulnerabilities: allVulnerabilities.length,
        bySeverity,
        vulnerabilities: allVulnerabilities,
        duration: Date.now() - startTime,
        timestamp,
      };
    } catch (error) {
      return {
        success: false,
        totalVulnerabilities: 0,
        bySeverity: { critical: 0, high: 0, medium: 0, low: 0, note: 0 },
        vulnerabilities: [],
        duration: Date.now() - startTime,
        timestamp,
        error: String(error),
      };
    }
  }

  /**
   * Scan a skill package
   */
  async scanSkill(skillPath: string): Promise<CodeQLScanResult> {
    return this.scan(skillPath);
  }

  /**
   * Generate security report for dashboard
   */
  generateReport(result: CodeQLScanResult): string {
    const { totalVulnerabilities, bySeverity, duration } = result;

    let report = "CodeQL Security Scan Report\n";
    report += "===========================\n\n";

    if (!result.success) {
      report += `❌ Scan failed: ${result.error}\n`;
      return report;
    }

    report += `Total vulnerabilities: ${totalVulnerabilities}\n`;
    report += `Scan duration: ${(duration / 1000).toFixed(2)}s\n\n`;

    report += "By Severity:\n";
    report += `  Critical: ${bySeverity.critical}\n`;
    report += `  High:     ${bySeverity.high}\n`;
    report += `  Medium:   ${bySeverity.medium}\n`;
    report += `  Low:      ${bySeverity.low}\n`;
    report += `  Note:     ${bySeverity.note}\n\n`;

    if (totalVulnerabilities > 0) {
      report += "Vulnerabilities:\n";
      for (const vuln of result.vulnerabilities) {
        report += `\n${vuln.severity.toUpperCase()}: ${vuln.name}\n`;
        report += `  ${vuln.file}:${vuln.line}\n`;
        report += `  ${vuln.description}\n`;
        if (vuln.cwe) report += `  CWE: ${vuln.cwe}\n`;
        if (vuln.remediation) report += `  Fix: ${vuln.remediation}\n`;
      }
    }

    return report;
  }
}

/**
 * Quick scan helper function
 */
export async function scanWithCodeQL(
  sourceDir: string,
  config?: CodeQLConfig
): Promise<CodeQLScanResult> {
  const scanner = new CodeQLScanner(config);
  return scanner.scan(sourceDir);
}
