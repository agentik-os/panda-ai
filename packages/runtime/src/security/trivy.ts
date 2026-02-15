/**
 * Trivy Container Scanning Integration
 *
 * Scans Docker images and containers for:
 * - OS vulnerabilities (CVE database)
 * - Application dependencies vulnerabilities
 * - Misconfigurations
 * - Secret detection in images
 * - License compliance issues
 *
 * @packageDocumentation
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import * as fs from "node:fs/promises";
import * as path from "node:path";

const execFileAsync = promisify(execFile);

export interface TrivyConfig {
  /**
   * Path to Trivy binary
   * @default "trivy"
   */
  trivyPath?: string;

  /**
   * Severity levels to report
   * @default ["CRITICAL", "HIGH"]
   */
  severityLevels?: TrivySeverity[];

  /**
   * Scan timeout in milliseconds
   * @default 600000 (10 minutes)
   */
  timeout?: number;

  /**
   * Skip DB update
   * @default false
   */
  skipUpdate?: boolean;

  /**
   * Output format
   * @default "json"
   */
  format?: "json" | "table" | "sarif";
}

export type TrivySeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";

export interface TrivyVulnerability {
  /**
   * Vulnerability ID (CVE-xxxx-xxxx)
   */
  vulnerabilityID: string;

  /**
   * Package name
   */
  pkgName: string;

  /**
   * Installed version
   */
  installedVersion: string;

  /**
   * Fixed version (if available)
   */
  fixedVersion?: string;

  /**
   * Severity level
   */
  severity: TrivySeverity;

  /**
   * CVSS score
   */
  cvss?: number;

  /**
   * Description
   */
  description: string;

  /**
   * References (URLs)
   */
  references: string[];

  /**
   * Publish date
   */
  publishedDate?: string;

  /**
   * Last modified date
   */
  lastModifiedDate?: string;
}

export interface TrivyMisconfiguration {
  /**
   * Rule ID
   */
  id: string;

  /**
   * Title
   */
  title: string;

  /**
   * Description
   */
  description: string;

  /**
   * Severity
   */
  severity: TrivySeverity;

  /**
   * File path
   */
  file: string;

  /**
   * Resolution advice
   */
  resolution?: string;
}

export interface TrivySecret {
  /**
   * Rule ID
   */
  ruleID: string;

  /**
   * Category (e.g., "AWS", "GitHub", "Generic")
   */
  category: string;

  /**
   * Title
   */
  title: string;

  /**
   * Severity
   */
  severity: TrivySeverity;

  /**
   * File path
   */
  file: string;

  /**
   * Line number
   */
  startLine: number;

  /**
   * Match snippet (redacted)
   */
  match: string;
}

export interface TrivyScanResult {
  /**
   * Scan success status
   */
  success: boolean;

  /**
   * Target scanned (image name or path)
   */
  target: string;

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
    unknown: number;
  };

  /**
   * List of vulnerabilities
   */
  vulnerabilities: TrivyVulnerability[];

  /**
   * Misconfigurations found
   */
  misconfigurations: TrivyMisconfiguration[];

  /**
   * Secrets found
   */
  secrets: TrivySecret[];

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
 * Trivy vulnerability scanner
 */
export class TrivyScanner {
  private config: Required<TrivyConfig>;

  constructor(config: TrivyConfig = {}) {
    this.config = {
      trivyPath: config.trivyPath || "trivy",
      severityLevels: config.severityLevels || ["CRITICAL", "HIGH"],
      timeout: config.timeout || 600000,
      skipUpdate: config.skipUpdate ?? false,
      format: config.format || "json",
    };
  }

  /**
   * Check if Trivy is installed
   */
  async isInstalled(): Promise<boolean> {
    try {
      const { stdout } = await execFileAsync(this.config.trivyPath, ["--version"], {
        timeout: 5000,
      });
      return stdout.includes("Version");
    } catch {
      return false;
    }
  }

  /**
   * Get Trivy version
   */
  async getVersion(): Promise<string> {
    try {
      const { stdout } = await execFileAsync(this.config.trivyPath, ["--version"]);
      const match = stdout.match(/Version:\s*([\d.]+)/);
      return match?.[1] || "unknown";
    } catch (error) {
      throw new Error(`Failed to get Trivy version: ${String(error)}`);
    }
  }

  /**
   * Update vulnerability database
   */
  async updateDatabase(): Promise<void> {
    try {
      await execFileAsync(this.config.trivyPath, ["image", "--download-db-only"], {
        timeout: 120000, // 2 minutes
      });
    } catch (error) {
      throw new Error(`Failed to update Trivy database: ${String(error)}`);
    }
  }

  /**
   * Scan a Docker image
   */
  async scanImage(imageName: string): Promise<TrivyScanResult> {
    const startTime = Date.now();
    const timestamp = new Date();

    try {
      if (!(await this.isInstalled())) {
        return {
          success: false,
          target: imageName,
          totalVulnerabilities: 0,
          bySeverity: { critical: 0, high: 0, medium: 0, low: 0, unknown: 0 },
          vulnerabilities: [],
          misconfigurations: [],
          secrets: [],
          duration: Date.now() - startTime,
          timestamp,
          error: "Trivy not installed. Run: brew install trivy (macOS) or apt install trivy (Linux)",
        };
      }

      // Update DB if not skipped
      if (!this.config.skipUpdate) {
        await this.updateDatabase().catch((e) => {
          console.warn(`DB update failed: ${String(e)}`);
        });
      }

      // Create temp file for output
      const tempFile = path.join("/tmp", `trivy-${Date.now()}.json`);

      // Build command args
      const args = [
        "image",
        "--format",
        "json",
        "--severity",
        this.config.severityLevels.join(","),
        "--output",
        tempFile,
        "--scanners",
        "vuln,config,secret",
        imageName,
      ];

      // Run scan
      try {
        await execFileAsync(this.config.trivyPath, args, {
          timeout: this.config.timeout,
        });
      } catch (error) {
        // Trivy exits with code 1 if vulnerabilities found, which is expected
        // Only throw if it's a real error
        const errorStr = String(error);
        if (!errorStr.includes("exit code 1")) {
          throw error;
        }
      }

      // Parse results
      const resultStr = await fs.readFile(tempFile, "utf-8");
      const result = JSON.parse(resultStr);

      // Clean up temp file
      await fs.unlink(tempFile).catch(() => {});

      // Extract vulnerabilities
      const vulnerabilities: TrivyVulnerability[] = [];
      const misconfigurations: TrivyMisconfiguration[] = [];
      const secrets: TrivySecret[] = [];

      for (const scanResult of result.Results || []) {
        // Vulnerabilities
        for (const vuln of scanResult.Vulnerabilities || []) {
          vulnerabilities.push({
            vulnerabilityID: vuln.VulnerabilityID,
            pkgName: vuln.PkgName,
            installedVersion: vuln.InstalledVersion,
            fixedVersion: vuln.FixedVersion,
            severity: vuln.Severity as TrivySeverity,
            cvss: vuln.CVSS?.redhat?.V3Score || vuln.CVSS?.nvd?.V3Score,
            description: vuln.Description || vuln.Title || "No description",
            references: vuln.References || [],
            publishedDate: vuln.PublishedDate,
            lastModifiedDate: vuln.LastModifiedDate,
          });
        }

        // Misconfigurations
        for (const misconfig of scanResult.Misconfigurations || []) {
          misconfigurations.push({
            id: misconfig.ID,
            title: misconfig.Title,
            description: misconfig.Description,
            severity: misconfig.Severity as TrivySeverity,
            file: misconfig.CauseMetadata?.Resource || scanResult.Target || "unknown",
            resolution: misconfig.Resolution,
          });
        }

        // Secrets
        for (const secret of scanResult.Secrets || []) {
          secrets.push({
            ruleID: secret.RuleID,
            category: secret.Category,
            title: secret.Title,
            severity: secret.Severity as TrivySeverity,
            file: scanResult.Target || "unknown",
            startLine: secret.StartLine || 0,
            match: secret.Match ? "***REDACTED***" : "",
          });
        }
      }

      // Count by severity
      const bySeverity = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        unknown: 0,
      };

      for (const vuln of vulnerabilities) {
        const severityKey = vuln.severity.toLowerCase() as keyof typeof bySeverity;
        if (severityKey in bySeverity) {
          bySeverity[severityKey]++;
        }
      }

      return {
        success: true,
        target: imageName,
        totalVulnerabilities: vulnerabilities.length,
        bySeverity,
        vulnerabilities,
        misconfigurations,
        secrets,
        duration: Date.now() - startTime,
        timestamp,
      };
    } catch (error) {
      return {
        success: false,
        target: imageName,
        totalVulnerabilities: 0,
        bySeverity: { critical: 0, high: 0, medium: 0, low: 0, unknown: 0 },
        vulnerabilities: [],
        misconfigurations: [],
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
  async scanFilesystem(dirPath: string): Promise<TrivyScanResult> {
    const startTime = Date.now();
    const timestamp = new Date();

    try {
      if (!(await this.isInstalled())) {
        return {
          success: false,
          target: dirPath,
          totalVulnerabilities: 0,
          bySeverity: { critical: 0, high: 0, medium: 0, low: 0, unknown: 0 },
          vulnerabilities: [],
          misconfigurations: [],
          secrets: [],
          duration: Date.now() - startTime,
          timestamp,
          error: "Trivy not installed",
        };
      }

      const tempFile = path.join("/tmp", `trivy-fs-${Date.now()}.json`);

      const args = [
        "fs",
        "--format",
        "json",
        "--severity",
        this.config.severityLevels.join(","),
        "--output",
        tempFile,
        "--scanners",
        "vuln,config,secret",
        dirPath,
      ];

      try {
        await execFileAsync(this.config.trivyPath, args, {
          timeout: this.config.timeout,
        });
      } catch (error) {
        const errorStr = String(error);
        if (!errorStr.includes("exit code 1")) {
          throw error;
        }
      }

      const resultStr = await fs.readFile(tempFile, "utf-8");
      const result = JSON.parse(resultStr);

      await fs.unlink(tempFile).catch(() => {});

      // Parse results (same as scanImage)
      const vulnerabilities: TrivyVulnerability[] = [];
      const misconfigurations: TrivyMisconfiguration[] = [];
      const secrets: TrivySecret[] = [];

      for (const scanResult of result.Results || []) {
        for (const vuln of scanResult.Vulnerabilities || []) {
          vulnerabilities.push({
            vulnerabilityID: vuln.VulnerabilityID,
            pkgName: vuln.PkgName,
            installedVersion: vuln.InstalledVersion,
            fixedVersion: vuln.FixedVersion,
            severity: vuln.Severity as TrivySeverity,
            cvss: vuln.CVSS?.redhat?.V3Score || vuln.CVSS?.nvd?.V3Score,
            description: vuln.Description || vuln.Title || "No description",
            references: vuln.References || [],
            publishedDate: vuln.PublishedDate,
            lastModifiedDate: vuln.LastModifiedDate,
          });
        }

        for (const misconfig of scanResult.Misconfigurations || []) {
          misconfigurations.push({
            id: misconfig.ID,
            title: misconfig.Title,
            description: misconfig.Description,
            severity: misconfig.Severity as TrivySeverity,
            file: misconfig.CauseMetadata?.Resource || scanResult.Target || "unknown",
            resolution: misconfig.Resolution,
          });
        }

        for (const secret of scanResult.Secrets || []) {
          secrets.push({
            ruleID: secret.RuleID,
            category: secret.Category,
            title: secret.Title,
            severity: secret.Severity as TrivySeverity,
            file: scanResult.Target || "unknown",
            startLine: secret.StartLine || 0,
            match: "***REDACTED***",
          });
        }
      }

      const bySeverity = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        unknown: 0,
      };

      for (const vuln of vulnerabilities) {
        const severityKey = vuln.severity.toLowerCase() as keyof typeof bySeverity;
        if (severityKey in bySeverity) {
          bySeverity[severityKey]++;
        }
      }

      return {
        success: true,
        target: dirPath,
        totalVulnerabilities: vulnerabilities.length,
        bySeverity,
        vulnerabilities,
        misconfigurations,
        secrets,
        duration: Date.now() - startTime,
        timestamp,
      };
    } catch (error) {
      return {
        success: false,
        target: dirPath,
        totalVulnerabilities: 0,
        bySeverity: { critical: 0, high: 0, medium: 0, low: 0, unknown: 0 },
        vulnerabilities: [],
        misconfigurations: [],
        secrets: [],
        duration: Date.now() - startTime,
        timestamp,
        error: String(error),
      };
    }
  }

  /**
   * Generate security report
   */
  generateReport(result: TrivyScanResult): string {
    const { target, totalVulnerabilities, bySeverity, duration } = result;

    let report = "Trivy Security Scan Report\n";
    report += "==========================\n\n";

    if (!result.success) {
      report += `❌ Scan failed: ${result.error}\n`;
      return report;
    }

    report += `Target: ${target}\n`;
    report += `Total vulnerabilities: ${totalVulnerabilities}\n`;
    report += `Scan duration: ${(duration / 1000).toFixed(2)}s\n\n`;

    report += "By Severity:\n";
    report += `  Critical: ${bySeverity.critical}\n`;
    report += `  High:     ${bySeverity.high}\n`;
    report += `  Medium:   ${bySeverity.medium}\n`;
    report += `  Low:      ${bySeverity.low}\n`;
    report += `  Unknown:  ${bySeverity.unknown}\n\n`;

    if (result.misconfigurations.length > 0) {
      report += `Misconfigurations: ${result.misconfigurations.length}\n`;
    }

    if (result.secrets.length > 0) {
      report += `⚠️ Secrets found: ${result.secrets.length}\n`;
    }

    if (totalVulnerabilities > 0) {
      report += "\nTop Vulnerabilities:\n";
      const top10 = result.vulnerabilities.slice(0, 10);
      for (const vuln of top10) {
        report += `\n${vuln.severity}: ${vuln.vulnerabilityID}\n`;
        report += `  Package: ${vuln.pkgName}@${vuln.installedVersion}\n`;
        if (vuln.fixedVersion) report += `  Fix: ${vuln.fixedVersion}\n`;
        if (vuln.cvss) report += `  CVSS: ${vuln.cvss}\n`;
      }
    }

    return report;
  }
}

/**
 * Quick scan helper
 */
export async function scanImageWithTrivy(
  imageName: string,
  config?: TrivyConfig
): Promise<TrivyScanResult> {
  const scanner = new TrivyScanner(config);
  return scanner.scanImage(imageName);
}
