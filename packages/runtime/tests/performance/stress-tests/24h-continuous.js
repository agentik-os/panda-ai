#!/usr/bin/env node
/**
 * Stress Test: 24-Hour Continuous Run
 * Target: No memory leaks, stable performance over 24 hours
 */

const { performance } = require("perf_hooks");
const fs = require("fs");
const path = require("path");

class StressTester {
  constructor(config) {
    this.config = config;
    this.results = {
      startTime: Date.now(),
      checkpoints: [],
      memorySnapshots: [],
      errorLog: [],
      metrics: {
        totalMessages: 0,
        totalErrors: 0,
        avgLatency: 0,
        p95Latency: 0,
        memoryTrend: "stable",
        performanceDegradation: false,
      },
    };
    this.running = true;
    this.logFile = path.join(
      __dirname,
      "../results",
      `stress-test-${Date.now()}.log`
    );
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] ${message}`;
    console.log(logLine);
    fs.appendFileSync(this.logFile, logLine + "\n");
  }

  async processMessage() {
    const start = performance.now();
    try {
      // Simulate full pipeline
      await this.simulatePipeline();
      const latency = performance.now() - start;
      return { success: true, latency };
    } catch (error) {
      this.results.errorLog.push({
        timestamp: Date.now(),
        error: error.message,
      });
      const latency = performance.now() - start;
      return { success: false, latency, error: error.message };
    }
  }

  async simulatePipeline() {
    // Simulate processing stages
    await this.sleep(1 + Math.random() * 2); // normalize
    await this.sleep(2 + Math.random() * 3); // route
    await this.sleep(5 + Math.random() * 10); // memory
    await this.sleep(10 + Math.random() * 20); // model select
    await this.sleep(30 + Math.random() * 80); // execute
    await this.sleep(5 + Math.random() * 10); // save
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  captureMemorySnapshot() {
    const mem = process.memoryUsage();
    return {
      timestamp: Date.now(),
      heapUsed: Math.round(mem.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
      rss: Math.round(mem.rss / 1024 / 1024),
      external: Math.round(mem.external / 1024 / 1024),
    };
  }

  createCheckpoint(checkpointNumber, metrics) {
    const checkpoint = {
      checkpoint: checkpointNumber,
      timestamp: Date.now(),
      uptime: Date.now() - this.results.startTime,
      totalMessages: metrics.totalMessages,
      totalErrors: metrics.totalErrors,
      avgLatency: metrics.avgLatency,
      p95Latency: metrics.p95Latency,
      memory: this.captureMemorySnapshot(),
    };

    this.results.checkpoints.push(checkpoint);

    this.log(
      `Checkpoint ${checkpointNumber} | Messages: ${metrics.totalMessages} | P95: ${metrics.p95Latency}ms | Heap: ${checkpoint.memory.heapUsed}MB`
    );

    return checkpoint;
  }

  analyzeMemoryTrend() {
    if (this.results.memorySnapshots.length < 10) return "insufficient_data";

    const recentSnapshots = this.results.memorySnapshots.slice(-10);
    const firstHeap = recentSnapshots[0].heapUsed;
    const lastHeap = recentSnapshots[recentSnapshots.length - 1].heapUsed;

    const growthRate = (lastHeap - firstHeap) / firstHeap;

    if (growthRate > 0.2) return "increasing"; // >20% growth = leak suspected
    if (growthRate < -0.1) return "decreasing";
    return "stable";
  }

  async runBatch(batchNumber) {
    const batchSize = 100;
    const latencies = [];
    let errors = 0;

    for (let i = 0; i < batchSize; i++) {
      const result = await this.processMessage();
      latencies.push(result.latency);
      if (!result.success) errors++;
      this.results.metrics.totalMessages++;
    }

    // Calculate metrics
    latencies.sort((a, b) => a - b);
    const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const p95 = latencies[Math.floor(latencies.length * 0.95)];

    this.results.metrics.totalErrors += errors;

    return {
      totalMessages: this.results.metrics.totalMessages,
      totalErrors: this.results.metrics.totalErrors,
      avgLatency: Math.round(avg * 100) / 100,
      p95Latency: Math.round(p95 * 100) / 100,
    };
  }

  async run() {
    this.log(`🚀 Starting 24-Hour Stress Test`);
    this.log(`   Duration: ${this.config.durationHours} hours`);
    this.log(`   Checkpoint interval: ${this.config.checkpointMinutes} minutes\n`);

    const durationMs = this.config.durationHours * 60 * 60 * 1000;
    const checkpointInterval = this.config.checkpointMinutes * 60 * 1000;
    const endTime = Date.now() + durationMs;

    let checkpointNumber = 0;
    let lastCheckpoint = Date.now();
    let batchNumber = 0;

    // Graceful shutdown handler
    process.on("SIGINT", () => {
      this.log("\n⚠️  Received SIGINT - gracefully shutting down...");
      this.running = false;
    });

    while (this.running && Date.now() < endTime) {
      // Run batch
      const metrics = await this.runBatch(batchNumber);
      batchNumber++;

      // Capture memory every 100 batches
      if (batchNumber % 100 === 0) {
        this.results.memorySnapshots.push(this.captureMemorySnapshot());
      }

      // Create checkpoint if interval passed
      if (Date.now() - lastCheckpoint >= checkpointInterval) {
        checkpointNumber++;
        this.createCheckpoint(checkpointNumber, metrics);
        lastCheckpoint = Date.now();

        // Analyze memory trend
        this.results.metrics.memoryTrend = this.analyzeMemoryTrend();
        if (this.results.metrics.memoryTrend === "increasing") {
          this.log("⚠️  WARNING: Memory increasing trend detected");
        }
      }

      // Small delay between batches
      await this.sleep(100);
    }

    this.finalizeResults();
    this.printResults();
    this.saveResults();

    return this.results;
  }

  finalizeResults() {
    // Check for performance degradation
    if (this.results.checkpoints.length >= 2) {
      const firstCheckpoint = this.results.checkpoints[0];
      const lastCheckpoint =
        this.results.checkpoints[this.results.checkpoints.length - 1];

      const latencyIncrease =
        (lastCheckpoint.p95Latency - firstCheckpoint.p95Latency) /
        firstCheckpoint.p95Latency;

      this.results.metrics.performanceDegradation = latencyIncrease > 0.15; // >15% degradation
    }
  }

  printResults() {
    this.log("\n" + "=".repeat(60));
    this.log("📊 STRESS TEST RESULTS");
    this.log("=".repeat(60));

    const durationHours =
      (Date.now() - this.results.startTime) / 1000 / 60 / 60;
    this.log(`Duration: ${durationHours.toFixed(2)} hours`);
    this.log(`Total Messages: ${this.results.metrics.totalMessages}`);
    this.log(`Total Errors: ${this.results.metrics.totalErrors}`);
    this.log(`Checkpoints: ${this.results.checkpoints.length}`);

    if (this.results.checkpoints.length > 0) {
      const lastCheckpoint =
        this.results.checkpoints[this.results.checkpoints.length - 1];
      this.log(`\nFinal Metrics:`);
      this.log(`  P95 Latency: ${lastCheckpoint.p95Latency}ms`);
      this.log(`  Heap Used: ${lastCheckpoint.memory.heapUsed}MB`);
      this.log(`  RSS: ${lastCheckpoint.memory.rss}MB`);
    }

    this.log("\n" + "-".repeat(60));
    this.log("🎯 TARGET VALIDATION");
    this.log("-".repeat(60));

    const memoryPass = this.results.metrics.memoryTrend !== "increasing";
    const perfPass = !this.results.metrics.performanceDegradation;

    this.log(
      `Memory Stable: ${memoryPass ? "✅ PASS" : "❌ FAIL"} (${this.results.metrics.memoryTrend})`
    );
    this.log(
      `No Performance Degradation: ${perfPass ? "✅ PASS" : "❌ FAIL"}`
    );

    if (this.results.errorLog.length > 0) {
      this.log(`\n⚠️  ${this.results.errorLog.length} errors occurred`);
    }
  }

  saveResults() {
    const resultsDir = path.join(__dirname, "../results");
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    const filename = `stress-test-24h-${Date.now()}.json`;
    const filepath = path.join(resultsDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(this.results, null, 2));
    this.log(`\n💾 Results saved to: ${filepath}`);
    this.log(`📋 Full log: ${this.logFile}`);
  }
}

// Run the test
const config = {
  durationHours: process.env.DURATION_HOURS
    ? parseFloat(process.env.DURATION_HOURS)
    : 24,
  checkpointMinutes: process.env.CHECKPOINT_MINUTES
    ? parseInt(process.env.CHECKPOINT_MINUTES)
    : 30,
};

const tester = new StressTester(config);
tester.run().then((results) => {
  const pass =
    results.metrics.memoryTrend !== "increasing" &&
    !results.metrics.performanceDegradation;
  process.exit(pass ? 0 : 1);
});
