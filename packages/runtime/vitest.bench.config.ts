import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/performance/benchmarks/**/*.bench.ts"],
    benchmark: {
      include: ["tests/performance/benchmarks/**/*.bench.ts"],
      exclude: ["node_modules"],
    },
    reporters: ["default", "json"],
    outputFile: {
      json: "tests/performance/results/benchmark-results.json",
    },
  },
});
