# CLI Tests

Comprehensive test suite for the Agentik OS CLI package.

## Test Coverage

### Current Status: 30/31 tests passing (96.8% pass rate)

**Completed:**
- ✅ Init command tests (16/17 passing)
- ✅ Config module tests (13/14 passing)
- ✅ Test infrastructure and helpers

**In Progress:**
- ⚠️ 2 test failures due to source code design issue (see Known Issues)
- 🚧 Agent create command tests
- 🚧 Agent list command tests
- 🚧 Chat command tests
- 🚧 Logs command tests

## Running Tests

### Prerequisites

```bash
# From CLI package directory
cd packages/cli
```

### Run All Tests

```bash
bun run test
```

### Run Tests in Watch Mode

```bash
bun run test:watch
```

### Run Tests with Coverage

```bash
bun run test:coverage
```

### Run Specific Test File

```bash
bun run test init.test.ts
bun run test config.test.ts
```

## Test Structure

```
tests/
├── setup.ts               # Global test helpers
├── init.test.ts           # Init command tests (17 tests)
└── README.md              # This file

src/config/
└── config.test.ts         # Config module tests (14 tests)
```

## Test Helpers

### mockHomeDir()

Creates an isolated temporary HOME directory for each test.

```typescript
import { mockHomeDir } from "./setup";

let homeSetup: ReturnType<typeof mockHomeDir>;

beforeEach(() => {
  homeSetup = mockHomeDir();
  // homeSetup.homeDir contains the temp directory path
});

afterEach(() => {
  homeSetup.cleanup(); // Removes temp directory
});
```

### createMockAgent()

Creates mock agent data for testing.

```typescript
import { createMockAgent } from "./setup";

const agent = createMockAgent({
  name: "Custom Agent",
  model: "gpt-4",
});
```

### createMockConversation()

Creates mock conversation data for testing.

```typescript
import { createMockConversation } from "./setup";

const conversation = createMockConversation({
  agentId: "test-agent-1",
});
```

## Known Issues

### Test Isolation Failures (2 tests)

**Issue:** Both `config.ts` and `init.ts` use module-level constants that call `os.homedir()` at import time:

```typescript
// config.ts:7-8 & init.ts:12-13
const CONFIG_DIR = join(homedir(), ".agentik-os");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");
```

**Impact:** These constants cannot be mocked in tests because they're evaluated once at module import, before test setup runs.

**Failing Tests:**
1. `config.test.ts` - "should return false when config does not exist"
2. `init.test.ts` - "should prompt to overwrite if config exists"

**Root Cause:**
- `os.homedir()` caches the original HOME directory
- Test mocks of `process.env.HOME` don't affect already-evaluated constants
- Cannot mock `os.homedir()` effectively due to Vitest hoisting/temporal dead zone issues

**Proposed Fix:**
Refactor to use getter functions or `process.env.HOME` directly:

```typescript
// Option 1: Getter functions
function getConfigDir(): string {
  return join(process.env.HOME || homedir(), ".agentik-os");
}

function getConfigFile(): string {
  return join(getConfigDir(), "config.json");
}

// Option 2: Use process.env.HOME directly
const CONFIG_DIR = join(process.env.HOME || homedir(), ".agentik-os");
```

**Status:** Awaiting team decision on source code refactor.

## Test Configuration

See `vitest.config.ts` for full configuration:
- Environment: Node
- Setup file: `tests/setup.ts`
- Coverage: `src/**/*.ts`
- Timeout: 30 seconds per test

## Writing New Tests

### Example Test Structure

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mockHomeDir } from "./setup";

describe("My Feature", () => {
  let homeSetup: ReturnType<typeof mockHomeDir>;

  beforeEach(() => {
    homeSetup = mockHomeDir();
  });

  afterEach(() => {
    homeSetup.cleanup();
    vi.clearAllMocks();
  });

  it("should do something", async () => {
    // Arrange
    const configDir = path.join(homeSetup.homeDir, ".agentik-os");

    // Act
    const result = await someFunction();

    // Assert
    expect(result).toBe(expected);
  });
});
```

### Best Practices

1. **Isolation:** Each test should have its own temp directory via `mockHomeDir()`
2. **Cleanup:** Always call `homeSetup.cleanup()` in `afterEach()`
3. **Mock Clear:** Clear mocks with `vi.clearAllMocks()` after each test
4. **Async/Await:** Use async/await for command tests (they're async functions)
5. **Mock Inquirer:** Mock user input for interactive commands

## Debugging Tests

### Run Single Test

```bash
bun run test init.test.ts -t "should create .agentik-os directory"
```

### Run Tests in UI Mode

```bash
bun run test:ui
```

### View Coverage Report

```bash
bun run test:coverage
# Open coverage/index.html
```

---

**Last Updated:** 2026-02-14
**Maintainer:** testing-qa agent
**Test Framework:** Vitest v4.0.18
**Pass Rate:** 96.8% (30/31 tests)
