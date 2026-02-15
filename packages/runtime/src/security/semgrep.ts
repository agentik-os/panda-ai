/**
 * Semgrep Security Scanner
 * Static code analysis for security vulnerabilities
 */

import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";

const execAsync = promisify(exec);

export interface SecurityIssue {
  severity: "critical" | "high" | "medium" | "low";
  message: string;
  file: string;
  line: number;
  rule: string;
  cwe?: string[];
}

export interface SecurityScanResult {
  issues: SecurityIssue[];
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  scannedFiles: number;
  reportPath?: string;
}

/**
 * Run Semgrep security scan on a directory
 */
export async function runSecurityScan(
  targetPath: string
): Promise<SecurityScanResult> {
  try {
    // Check if semgrep is installed
    try {
      await execAsync("semgrep --version");
    } catch {
      throw new Error(
        "Semgrep is not installed. Install with: pip install semgrep"
      );
    }

    // Get rules file path
    const rulesPath = path.join(__dirname, "rules.yml");

    // Check if custom rules exist, otherwise use default rulesets
    const useCustomRules = await fileExists(rulesPath);

    const ruleArg = useCustomRules
      ? `--config ${rulesPath}`
      : "--config=auto --config=p/security-audit --config=p/owasp-top-ten";

    // Run semgrep
    const command = `semgrep ${ruleArg} --json --quiet "${targetPath}"`;

    let stdout: string;
    try {
      const result = await execAsync(command, {
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });
      stdout = result.stdout;
    } catch (error: any) {
      // Semgrep exits with non-zero if findings are found
      stdout = error.stdout || "{}";
    }

    // Parse results
    const results = JSON.parse(stdout);
    const issues: SecurityIssue[] = [];

    if (results.results) {
      for (const finding of results.results) {
        const severity = mapSeverity(finding.extra?.severity);

        issues.push({
          severity,
          message: finding.extra?.message || finding.check_id,
          file: finding.path,
          line: finding.start?.line || 0,
          rule: finding.check_id,
          cwe: finding.extra?.metadata?.cwe,
        });
      }
    }

    // Count by severity
    const counts = issues.reduce(
      (acc, issue) => {
        acc[`${issue.severity}Issues`]++;
        return acc;
      },
      {
        criticalIssues: 0,
        highIssues: 0,
        mediumIssues: 0,
        lowIssues: 0,
      }
    );

    return {
      issues,
      ...counts,
      scannedFiles: results.paths?.scanned?.length || 0,
    };
  } catch (error) {
    throw new Error(
      `Security scan failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Map Semgrep severity to our standard levels
 */
function mapSeverity(
  severity?: string
): "critical" | "high" | "medium" | "low" {
  switch (severity?.toLowerCase()) {
    case "error":
    case "critical":
      return "critical";
    case "warning":
    case "high":
      return "high";
    case "info":
    case "medium":
      return "medium";
    default:
      return "low";
  }
}

/**
 * Check if a file exists
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
