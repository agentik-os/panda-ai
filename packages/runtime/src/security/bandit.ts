/**
 * Bandit Security Scanner
 * Python security vulnerability scanner
 */

import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";
import { SecurityIssue, SecurityScanResult } from "./semgrep";

const execAsync = promisify(exec);

/**
 * Run Bandit security scan on Python files
 */
export async function runBanditScan(
  targetPath: string
): Promise<SecurityScanResult> {
  try {
    // Check if there are Python files
    const hasPythonFiles = await containsPythonFiles(targetPath);

    if (!hasPythonFiles) {
      return {
        issues: [],
        criticalIssues: 0,
        highIssues: 0,
        mediumIssues: 0,
        lowIssues: 0,
        scannedFiles: 0,
      };
    }

    // Check if bandit is installed
    try {
      await execAsync("bandit --version");
    } catch {
      throw new Error(
        "Bandit is not installed. Install with: pip install bandit"
      );
    }

    // Run bandit
    const command = `bandit -r "${targetPath}" -f json -ll`;

    let stdout: string;
    try {
      const result = await execAsync(command, {
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });
      stdout = result.stdout;
    } catch (error: any) {
      // Bandit exits with non-zero if findings are found
      stdout = error.stdout || "{}";
    }

    // Parse results
    const results = JSON.parse(stdout);
    const issues: SecurityIssue[] = [];

    if (results.results) {
      for (const finding of results.results) {
        const severity = mapBanditSeverity(
          finding.issue_severity,
          finding.issue_confidence
        );

        issues.push({
          severity,
          message: finding.issue_text,
          file: finding.filename,
          line: finding.line_number,
          rule: finding.test_id,
          cwe: finding.issue_cwe ? [finding.issue_cwe] : undefined,
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
      scannedFiles: results.metrics?._totals?.loc || 0,
    };
  } catch (error) {
    throw new Error(
      `Bandit scan failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Check if directory contains Python files
 */
async function containsPythonFiles(dirPath: string): Promise<boolean> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name === "node_modules" || entry.name === ".git") {
        continue;
      }

      if (entry.isFile() && entry.name.endsWith(".py")) {
        return true;
      }

      if (entry.isDirectory()) {
        const fullPath = path.join(dirPath, entry.name);
        const hasPython = await containsPythonFiles(fullPath);
        if (hasPython) return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Map Bandit severity to our standard levels
 */
function mapBanditSeverity(
  severity?: string,
  confidence?: string
): "critical" | "high" | "medium" | "low" {
  // High severity + high confidence = critical
  if (severity === "HIGH" && confidence === "HIGH") {
    return "critical";
  }

  // High severity = high
  if (severity === "HIGH") {
    return "high";
  }

  // Medium severity = medium
  if (severity === "MEDIUM") {
    return "medium";
  }

  // Everything else = low
  return "low";
}
