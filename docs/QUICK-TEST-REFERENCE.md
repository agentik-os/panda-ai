# Quick Testing Reference

> **TL;DR:** Write `.test.ts` files alongside your code. Tests run in CI automatically.

---

## 🚀 Quick Start

### 1. Create a test file

```bash
# If you create: src/pipeline/normalize.ts
# Also create:   src/pipeline/normalize.test.ts
```

### 2. Write a simple test

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from './my-file';

describe('myFunction', () => {
  it('should work correctly', () => {
    const result = myFunction('input');
    expect(result).toBe('expected output');
  });
});
```

### 3. Run tests

```bash
pnpm test                 # Run all tests
pnpm test my-file.test.ts # Run specific test
pnpm test:watch           # Watch mode
```

---

## 📝 Test Patterns

### Unit Test (Simple Function)

```typescript
import { describe, it, expect } from 'vitest';
import { calculateComplexity } from './complexity';

describe('calculateComplexity', () => {
  it('returns low score for simple messages', () => {
    expect(calculateComplexity('Hi')).toBeLessThan(30);
  });
});
```

### Unit Test (With Mocks)

```typescript
import { describe, it, expect, vi } from 'vitest';
import { fetchData } from './api';

// Mock the external API
vi.mock('@anthropic-ai/sdk', () => ({
  Anthropic: vi.fn(() => ({
    messages: {
      create: vi.fn().mockResolvedValue({ content: [{ text: 'Mocked!' }] })
    }
  }))
}));

describe('fetchData', () => {
  it('calls API correctly', async () => {
    const result = await fetchData('test');
    expect(result).toBe('Mocked!');
  });
});
```

### Integration Test

```typescript
import { describe, it, expect } from 'vitest';
import { Pipeline } from '../src/pipeline';
import { InMemoryMemory } from '../src/memory/in-memory';

describe('Pipeline Integration', () => {
  it('processes message end-to-end', async () => {
    const pipeline = new Pipeline({
      memory: new InMemoryMemory()
    });

    const result = await pipeline.process({
      text: 'Hello',
      channel: 'test'
    });

    expect(result.status).toBe('success');
  });
});
```

### E2E Test (Playwright - Dashboard only)

```typescript
import { test, expect } from '@playwright/test';

test('creates a new agent', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-testid="create-agent"]');
  await page.fill('[name="name"]', 'Test Agent');
  await page.click('[data-testid="submit"]');

  await expect(page.locator('text=Test Agent')).toBeVisible();
});
```

---

## 🎯 Common Assertions

```typescript
// Equality
expect(value).toBe(5);
expect(value).toEqual({ a: 1 });

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeUndefined();

// Numbers
expect(value).toBeGreaterThan(3);
expect(value).toBeLessThan(10);
expect(value).toBeCloseTo(3.14, 2);

// Strings
expect(text).toContain('hello');
expect(text).toMatch(/hello/i);

// Arrays/Objects
expect(array).toHaveLength(3);
expect(array).toContain('item');
expect(obj).toHaveProperty('key');

// Async
await expect(promise).resolves.toBe('value');
await expect(promise).rejects.toThrow('error');

// Functions
expect(fn).toHaveBeenCalled();
expect(fn).toHaveBeenCalledWith('arg');
expect(fn).toHaveBeenCalledTimes(2);
```

---

## 🧪 Useful Vitest Functions

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('My tests', () => {
  // Runs before each test
  beforeEach(() => {
    // Setup
  });

  // Runs after each test
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('test name', () => {
    // Your test
  });
});

// Mock a function
const mockFn = vi.fn();
mockFn.mockReturnValue('value');
mockFn.mockResolvedValue('async value');

// Spy on a method
const spy = vi.spyOn(obj, 'method');

// Fake timers
vi.useFakeTimers();
vi.advanceTimersByTime(1000);
vi.useRealTimers();
```

---

## ✅ Pre-Commit Checklist

Before committing your code:

```bash
# 1. Run tests
pnpm test

# 2. Check coverage
pnpm test:coverage

# 3. Type check
pnpm type-check

# 4. Lint
pnpm lint

# 5. Build
pnpm build
```

Or run all at once:
```bash
pnpm ci:check  # Runs everything CI would run
```

---

## 🔍 Debugging Tests

### Run with verbose output
```bash
pnpm test --reporter=verbose
```

### Run specific test
```bash
pnpm test -t "test name"
```

### Debug in VS Code
Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Tests",
  "runtimeExecutable": "pnpm",
  "runtimeArgs": ["test", "${file}"]
}
```

---

## 📊 Coverage Requirements

| Package | Minimum |
|---------|---------|
| runtime | 85% |
| dashboard | 75% |
| cli | 80% |
| sdk | 85% |
| shared | 90% |

View coverage report:
```bash
pnpm test:coverage
open coverage/index.html
```

---

## 🆘 Common Issues

### "Module not found"
- Check imports use correct paths
- Check package is in dependencies

### "Timeout"
- Increase timeout: `it('test', () => {...}, 10000)`
- Check for infinite loops

### "Mock not working"
- Call `vi.clearAllMocks()` in `afterEach`
- Check mock is set up before import

### "Coverage too low"
- Run `pnpm test:coverage` to see uncovered lines
- Add tests for missing branches

---

## 📚 More Info

- **Full guide:** [TESTING-GUIDE.md](./TESTING-GUIDE.md)
- **Setup:** [TESTING-SETUP.md](./TESTING-SETUP.md)
- **Contributing:** [../CONTRIBUTING.md](../CONTRIBUTING.md)
- **Vitest docs:** https://vitest.dev
- **Playwright docs:** https://playwright.dev

---

**Need help?** Ask testing-qa agent!
