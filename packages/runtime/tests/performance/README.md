# Performance & Load Testing Suite

## Overview

Comprehensive performance testing for Agentik OS runtime to ensure production-ready scalability.

## Test Categories

### 1. Benchmarks (`benchmarks/`)
Unit-level performance tests using Vitest benchmarks.
- Pipeline stages
- Model router
- Memory operations
- Tool execution

**Run:** `pnpm test:bench`

### 2. Load Tests (`load-tests/`)
High-concurrency scenarios simulating production load.
- 100 concurrent agents
- 1,000 messages/minute
- Marketplace with 1,000 skills
- 50 simultaneous dashboard users

**Run:** `node tests/performance/load-tests/run-all.js`

### 3. Stress Tests (`stress-tests/`)
Long-duration tests to detect memory leaks and degradation.
- 24-hour continuous run
- Database connection pooling
- WebSocket connection limits
- API rate limiting

**Run:** `node tests/performance/stress-tests/24h-continuous.js`

## Performance Targets

| Metric | Target | Test |
|--------|--------|------|
| Response time (p95) | <200ms | benchmarks/pipeline.bench.ts |
| Agent startup | <1s | load-tests/agent-startup.js |
| Dashboard page load | <2s | load-tests/dashboard-load.js |
| Skill execution overhead | <50ms | benchmarks/skills.bench.ts |
| 100 concurrent agents | Stable | load-tests/concurrent-agents.js |
| 1,000 msg/min throughput | No degradation | load-tests/message-throughput.js |
| 24h continuous | No memory leak | stress-tests/24h-continuous.js |

## Quick Start

```bash
# Run all benchmarks
pnpm test:bench

# Run specific benchmark
pnpm test:bench -- pipeline.bench.ts

# Run load tests
node tests/performance/load-tests/concurrent-agents.js

# Run stress test (background)
nohup node tests/performance/stress-tests/24h-continuous.js > stress.log 2>&1 &
```

## Results

Results are saved to `tests/performance/results/` with timestamps:
- `benchmark-{timestamp}.json` - Vitest benchmark results
- `load-test-{timestamp}.json` - Load test metrics
- `stress-test-{timestamp}.json` - Stress test logs

## CI Integration

GitHub Actions runs benchmarks on every PR:
- Fails if p95 >200ms
- Fails if agent startup >1s
- Reports performance regression vs main branch
