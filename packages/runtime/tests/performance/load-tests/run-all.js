#!/usr/bin/env node
/**
 * Run All Load Tests
 * Executes all load test scenarios and generates combined report
 */

const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

class LoadTestRunner {
  constructor() {
    this.results = {
      startTime: Date.now(),
      tests: [],
      summary: {
        totalPassed: 0,
        totalFailed: 0,
        totalDuration: 0,
      },
    };
  }

  async runTest(name, scriptPath, env = {}) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`Running: ${name}`);
    console.log("=".repeat(60));

    const startTime = Date.now();

    return new Promise((resolve) => {
      const child = spawn("node", [scriptPath], {
        env: { ...process.env, ...env },
        stdio: "inherit",
      });

      child.on("close", (code) => {
        const duration = Date.now() - startTime;
        const passed = code === 0;

        this.results.tests.push({
          name,
          passed,
          duration,
          exitCode: code,
        });

        if (passed) {
          this.results.summary.totalPassed++;
        } else {
          this.results.summary.totalFailed++;
        }

        resolve(passed);
      });
    });
  }

  async run() {
    console.log("\n🚀 Load Test Suite - Running All Tests\n");

    const testsDir = __dirname;

    // Test 1: Concurrent Agents
    await this.runTest(
      "100 Concurrent Agents",
      path.join(testsDir, "concurrent-agents.js"),
      {
        NUM_AGENTS: "100",
        REQUESTS_PER_AGENT: "10",
      }
    );

    // Test 2: Message Throughput
    await this.runTest(
      "1,000 Messages/Minute Throughput",
      path.join(testsDir, "message-throughput.js"),
      {
        TARGET_THROUGHPUT: "1000",
        DURATION: "60",
        BATCH_SIZE: "50",
      }
    );

    // Calculate total duration
    this.results.summary.totalDuration =
      Date.now() - this.results.startTime;

    this.printSummary();
    this.saveReport();

    return this.results;
  }

  printSummary() {
    console.log("\n" + "=".repeat(60));
    console.log("📊 LOAD TEST SUITE SUMMARY");
    console.log("=".repeat(60));

    this.results.tests.forEach((test) => {
      const status = test.passed ? "✅ PASS" : "❌ FAIL";
      const duration = (test.duration / 1000).toFixed(1);
      console.log(`${status} ${test.name} (${duration}s)`);
    });

    console.log("\n" + "-".repeat(60));
    console.log(
      `Total: ${this.results.summary.totalPassed} passed, ${this.results.summary.totalFailed} failed`
    );
    console.log(
      `Duration: ${(this.results.summary.totalDuration / 1000).toFixed(1)}s`
    );

    const allPassed = this.results.summary.totalFailed === 0;
    console.log(
      `\n${allPassed ? "✅ ALL TESTS PASSED" : "❌ SOME TESTS FAILED"}`
    );
  }

  saveReport() {
    const resultsDir = path.join(__dirname, "../results");
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    const filename = `load-test-suite-${Date.now()}.json`;
    const filepath = path.join(resultsDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(this.results, null, 2));
    console.log(`\n💾 Full report saved to: ${filepath}`);
  }
}

// Run the suite
const runner = new LoadTestRunner();
runner.run().then((results) => {
  process.exit(results.summary.totalFailed > 0 ? 1 : 0);
});
