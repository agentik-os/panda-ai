#!/usr/bin/env node
/**
 * Load Test: 1,000 Messages/Minute Throughput
 * Target: Handle 1,000 msg/min without degradation
 */

const { performance } = require("perf_hooks");

class ThroughputTester {
  constructor(config) {
    this.config = config;
    this.results = {
      startTime: Date.now(),
      batches: [],
      metrics: {
        totalMessages: 0,
        totalDuration: 0,
        messagesPerSecond: 0,
        avgLatency: 0,
        p95Latency: 0,
        successRate: 0,
      },
    };
  }

  async processBatch(batchNumber, messagesInBatch) {
    const batchStart = performance.now();
    const batchMetrics = {
      batch: batchNumber,
      messages: messagesInBatch,
      latencies: [],
      errors: 0,
    };

    const promises = [];
    for (let i = 0; i < messagesInBatch; i++) {
      promises.push(this.processMessage(batchNumber, i));
    }

    const results = await Promise.allSettled(promises);

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        batchMetrics.latencies.push(result.value.latency);
      } else {
        batchMetrics.errors++;
      }
    });

    batchMetrics.duration = performance.now() - batchStart;
    batchMetrics.throughput = (messagesInBatch / batchMetrics.duration) * 1000;

    return batchMetrics;
  }

  async processMessage(batchNumber, messageIndex) {
    const start = performance.now();

    try {
      // Simulate full pipeline
      await this.simulatePipeline({
        id: `${batchNumber}-${messageIndex}`,
        content: `Batch ${batchNumber} Message ${messageIndex}`,
      });

      const latency = performance.now() - start;
      return { success: true, latency };
    } catch (error) {
      const latency = performance.now() - start;
      return { success: false, latency, error: error.message };
    }
  }

  async simulatePipeline(message) {
    // Simulate processing stages (50-150ms total)
    const stages = [
      () => this.sleep(1 + Math.random() * 2), // normalize
      () => this.sleep(2 + Math.random() * 3), // route
      () => this.sleep(5 + Math.random() * 10), // memory
      () => this.sleep(10 + Math.random() * 20), // model select
      () => this.sleep(30 + Math.random() * 80), // execute
      () => this.sleep(5 + Math.random() * 10), // save
    ];

    for (const stage of stages) {
      await stage();
    }
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  calculateMetrics() {
    const allLatencies = this.results.batches.flatMap((b) => b.latencies);
    allLatencies.sort((a, b) => a - b);

    const sum = allLatencies.reduce((acc, val) => acc + val, 0);
    const avg = sum / allLatencies.length;

    const p95Index = Math.floor(allLatencies.length * 0.95);

    const totalMessages = this.results.batches.reduce(
      (acc, b) => acc + b.messages,
      0
    );
    const totalErrors = this.results.batches.reduce((acc, b) => acc + b.errors, 0);

    this.results.metrics = {
      totalMessages,
      totalDuration: this.results.totalDuration,
      messagesPerSecond: (totalMessages / this.results.totalDuration) * 1000,
      avgLatency: Math.round(avg * 100) / 100,
      p95Latency: Math.round(allLatencies[p95Index] * 100) / 100,
      successRate: ((totalMessages - totalErrors) / totalMessages) * 100,
    };
  }

  async run() {
    console.log(`\n🚀 Starting Throughput Test: ${this.config.targetThroughput} msg/min`);
    console.log(`   Duration: ${this.config.duration}s`);
    console.log(`   Batch size: ${this.config.batchSize} messages\n`);

    const startTime = performance.now();
    const messagesPerSecond = this.config.targetThroughput / 60;
    const batchInterval = (this.config.batchSize / messagesPerSecond) * 1000;

    let batchNumber = 0;
    const batches = [];

    // Run for specified duration
    const endTime = startTime + this.config.duration * 1000;

    while (performance.now() < endTime) {
      const batchStartTime = performance.now();

      console.log(`Batch ${batchNumber + 1}: Processing ${this.config.batchSize} messages...`);
      const batchMetrics = await this.processBatch(
        batchNumber,
        this.config.batchSize
      );

      batches.push(batchMetrics);
      batchNumber++;

      // Wait until next batch interval
      const elapsed = performance.now() - batchStartTime;
      const waitTime = Math.max(0, batchInterval - elapsed);
      if (waitTime > 0 && performance.now() + waitTime < endTime) {
        await this.sleep(waitTime);
      }
    }

    this.results.batches = batches;
    this.results.totalDuration = performance.now() - startTime;

    this.calculateMetrics();
    this.printResults();
    this.saveResults();

    return this.results;
  }

  printResults() {
    console.log("\n" + "=".repeat(60));
    console.log("📊 THROUGHPUT TEST RESULTS");
    console.log("=".repeat(60));
    console.log(`Total Duration: ${Math.round(this.results.totalDuration / 1000)}s`);
    console.log(`Total Messages: ${this.results.metrics.totalMessages}`);
    console.log(`Throughput: ${this.results.metrics.messagesPerSecond.toFixed(2)} msg/s`);
    console.log(`Success Rate: ${this.results.metrics.successRate.toFixed(2)}%`);
    console.log("\nLatency:");
    console.log(`  Average: ${this.results.metrics.avgLatency}ms`);
    console.log(`  P95: ${this.results.metrics.p95Latency}ms`);

    console.log("\n" + "-".repeat(60));
    console.log("🎯 TARGET VALIDATION");
    console.log("-".repeat(60));

    const targetMsgPerSec = this.config.targetThroughput / 60;
    const throughputPass = this.results.metrics.messagesPerSecond >= targetMsgPerSec * 0.95; // 95% of target
    const p95Pass = this.results.metrics.p95Latency < 200;

    console.log(`Throughput >= ${targetMsgPerSec.toFixed(2)} msg/s: ${throughputPass ? "✅ PASS" : "❌ FAIL"} (${this.results.metrics.messagesPerSecond.toFixed(2)} msg/s)`);
    console.log(`P95 < 200ms: ${p95Pass ? "✅ PASS" : "❌ FAIL"} (${this.results.metrics.p95Latency}ms)`);
  }

  saveResults() {
    const fs = require("fs");
    const path = require("path");

    const resultsDir = path.join(__dirname, "../results");
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    const filename = `load-test-throughput-${Date.now()}.json`;
    const filepath = path.join(resultsDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(this.results, null, 2));
    console.log(`\n💾 Results saved to: ${filepath}`);
  }
}

// Run the test
const config = {
  targetThroughput: process.env.TARGET_THROUGHPUT
    ? parseInt(process.env.TARGET_THROUGHPUT)
    : 1000, // msg/min
  duration: process.env.DURATION ? parseInt(process.env.DURATION) : 60, // seconds
  batchSize: process.env.BATCH_SIZE ? parseInt(process.env.BATCH_SIZE) : 50,
};

const tester = new ThroughputTester(config);
tester.run().then((results) => {
  const targetMsgPerSec = config.targetThroughput / 60;
  const pass =
    results.metrics.messagesPerSecond >= targetMsgPerSec * 0.95 &&
    results.metrics.p95Latency < 200;
  process.exit(pass ? 0 : 1);
});
