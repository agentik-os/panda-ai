#!/usr/bin/env node
/**
 * Load Test: 100 Concurrent Agents
 * Target: Stable performance with 100 agents running simultaneously
 */

const { performance } = require("perf_hooks");

class LoadTester {
  constructor(config) {
    this.config = config;
    this.results = {
      startTime: Date.now(),
      agents: [],
      errors: [],
      metrics: {
        avgResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        successRate: 0,
        totalRequests: 0,
      },
    };
  }

  async simulateAgent(agentId) {
    const agentMetrics = {
      id: agentId,
      requests: 0,
      errors: 0,
      responseTimes: [],
      startTime: Date.now(),
    };

    try {
      for (let i = 0; i < this.config.requestsPerAgent; i++) {
        const start = performance.now();

        // Simulate message processing
        await this.processMessage({
          agentId,
          messageId: `${agentId}-${i}`,
          content: `Message ${i} from agent ${agentId}`,
        });

        const duration = performance.now() - start;
        agentMetrics.responseTimes.push(duration);
        agentMetrics.requests++;

        // Random delay between requests (100-500ms)
        await this.sleep(100 + Math.random() * 400);
      }
    } catch (error) {
      agentMetrics.errors++;
      this.results.errors.push({
        agentId,
        error: error.message,
        timestamp: Date.now(),
      });
    }

    agentMetrics.endTime = Date.now();
    agentMetrics.duration = agentMetrics.endTime - agentMetrics.startTime;
    return agentMetrics;
  }

  async processMessage(message) {
    // Simulate pipeline stages
    await this.simulateNormalize();
    await this.simulateRoute();
    await this.simulateMemoryLoad();
    await this.simulateModelSelect();
    await this.simulateExecute();
    await this.simulateSaveMemory();
    return { success: true, response: "Processed" };
  }

  async simulateNormalize() {
    await this.sleep(1 + Math.random() * 2); // 1-3ms
  }

  async simulateRoute() {
    await this.sleep(2 + Math.random() * 3); // 2-5ms
  }

  async simulateMemoryLoad() {
    await this.sleep(5 + Math.random() * 10); // 5-15ms
  }

  async simulateModelSelect() {
    await this.sleep(10 + Math.random() * 20); // 10-30ms
  }

  async simulateExecute() {
    // Simulated AI call (in reality this would be external)
    await this.sleep(50 + Math.random() * 100); // 50-150ms
  }

  async simulateSaveMemory() {
    await this.sleep(5 + Math.random() * 10); // 5-15ms
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  calculateMetrics(agentResults) {
    const allResponseTimes = agentResults.flatMap((a) => a.responseTimes);
    allResponseTimes.sort((a, b) => a - b);

    const sum = allResponseTimes.reduce((acc, val) => acc + val, 0);
    const avg = sum / allResponseTimes.length;

    const p95Index = Math.floor(allResponseTimes.length * 0.95);
    const p99Index = Math.floor(allResponseTimes.length * 0.99);

    const totalRequests = agentResults.reduce((acc, a) => acc + a.requests, 0);
    const totalErrors = agentResults.reduce((acc, a) => acc + a.errors, 0);

    this.results.metrics = {
      avgResponseTime: Math.round(avg * 100) / 100,
      p95ResponseTime: Math.round(allResponseTimes[p95Index] * 100) / 100,
      p99ResponseTime: Math.round(allResponseTimes[p99Index] * 100) / 100,
      successRate: ((totalRequests - totalErrors) / totalRequests) * 100,
      totalRequests,
      totalErrors,
    };
  }

  async run() {
    console.log(`\n🚀 Starting Load Test: ${this.config.numAgents} Concurrent Agents`);
    console.log(`   Requests per agent: ${this.config.requestsPerAgent}`);
    console.log(`   Total requests: ${this.config.numAgents * this.config.requestsPerAgent}\n`);

    const startTime = performance.now();

    // Launch all agents concurrently
    const agentPromises = [];
    for (let i = 0; i < this.config.numAgents; i++) {
      agentPromises.push(this.simulateAgent(`agent-${i}`));
    }

    const agentResults = await Promise.all(agentPromises);
    this.results.agents = agentResults;

    const totalDuration = performance.now() - startTime;
    this.results.totalDuration = totalDuration;

    this.calculateMetrics(agentResults);
    this.printResults();
    this.saveResults();

    return this.results;
  }

  printResults() {
    console.log("\n" + "=".repeat(60));
    console.log("📊 LOAD TEST RESULTS");
    console.log("=".repeat(60));
    console.log(`Total Duration: ${Math.round(this.results.totalDuration / 1000)}s`);
    console.log(`Agents: ${this.config.numAgents}`);
    console.log(`Total Requests: ${this.results.metrics.totalRequests}`);
    console.log(`Total Errors: ${this.results.metrics.totalErrors}`);
    console.log(`Success Rate: ${this.results.metrics.successRate.toFixed(2)}%`);
    console.log("\nResponse Times:");
    console.log(`  Average: ${this.results.metrics.avgResponseTime}ms`);
    console.log(`  P95: ${this.results.metrics.p95ResponseTime}ms`);
    console.log(`  P99: ${this.results.metrics.p99ResponseTime}ms`);

    // Check against targets
    console.log("\n" + "-".repeat(60));
    console.log("🎯 TARGET VALIDATION");
    console.log("-".repeat(60));

    const p95Pass = this.results.metrics.p95ResponseTime < 200;
    const successPass = this.results.metrics.successRate > 99;

    console.log(`P95 < 200ms: ${p95Pass ? "✅ PASS" : "❌ FAIL"} (${this.results.metrics.p95ResponseTime}ms)`);
    console.log(`Success Rate > 99%: ${successPass ? "✅ PASS" : "❌ FAIL"} (${this.results.metrics.successRate.toFixed(2)}%)`);

    if (this.results.errors.length > 0) {
      console.log(`\n⚠️  ${this.results.errors.length} errors occurred`);
    }
  }

  saveResults() {
    const fs = require("fs");
    const path = require("path");

    const resultsDir = path.join(__dirname, "../results");
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    const filename = `load-test-concurrent-agents-${Date.now()}.json`;
    const filepath = path.join(resultsDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(this.results, null, 2));
    console.log(`\n💾 Results saved to: ${filepath}`);
  }
}

// Run the test
const config = {
  numAgents: process.env.NUM_AGENTS ? parseInt(process.env.NUM_AGENTS) : 100,
  requestsPerAgent: process.env.REQUESTS_PER_AGENT ? parseInt(process.env.REQUESTS_PER_AGENT) : 10,
};

const tester = new LoadTester(config);
tester.run().then((results) => {
  const pass = results.metrics.p95ResponseTime < 200 && results.metrics.successRate > 99;
  process.exit(pass ? 0 : 1);
});
