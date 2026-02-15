# Testing Guide - Agentik OS

> **Quality Bar:** >80% test coverage, all tests passing in CI

---

## Overview

All packages in the Agentik OS monorepo use **Vitest** for unit and integration tests, and **Playwright** for E2E tests.

## Test Structure

```
packages/
├── runtime/
│   ├── src/
│   │   ├── pipeline/
│   │   │   ├── normalize.ts
│   │   │   └── normalize.test.ts    # Unit tests alongside implementation
│   │   └── index.ts
│   └── tests/
│       └── integration/              # Integration tests
├── dashboard/
│   ├── app/
│   ├── components/
│   │   └── Button.test.tsx
│   └── e2e/                          # Playwright E2E tests
└── shared/
    └── src/
        └── types.test.ts
```

## Writing Tests

### Unit Tests (Vitest)

**Pattern:** Create `*.test.ts` files alongside your implementation.

```typescript
// packages/runtime/src/pipeline/normalize.test.ts
import { describe, it, expect } from 'vitest';
import { normalize } from './normalize';

describe('normalize', () => {
  it('should normalize Telegram message format', () => {
    const input = {
      channel: 'telegram',
      text: 'Hello world',
      from: { id: '123', name: 'Alice' }
    };

    const result = normalize(input);

    expect(result).toEqual({
      id: expect.any(String),
      text: 'Hello world',
      sender: { id: '123', name: 'Alice' },
      channel: 'telegram',
      timestamp: expect.any(Number)
    });
  });

  it('should handle missing fields gracefully', () => {
    const input = { channel: 'telegram', text: '' };
    const result = normalize(input);
    expect(result.text).toBe('');
  });
});
```

### Integration Tests

**Location:** `packages/*/tests/integration/`

```typescript
// packages/runtime/tests/integration/pipeline.test.ts
import { describe, it, expect } from 'vitest';
import { Pipeline } from '../src/pipeline';
import { InMemoryMemory } from '../src/memory/in-memory';

describe('Pipeline Integration', () => {
  it('should process message through all stages', async () => {
    const pipeline = new Pipeline({
      memory: new InMemoryMemory()
    });

    const result = await pipeline.process({
      channel: 'telegram',
      text: 'Hello agent',
      from: { id: '123', name: 'Alice' }
    });

    expect(result.status).toBe('success');
    expect(result.response).toBeTruthy();
  });
});
```

### E2E Tests (Playwright)

**Location:** `packages/dashboard/e2e/`

```typescript
// packages/dashboard/e2e/agents.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Agent Management', () => {
  test('should create a new agent', async ({ page }) => {
    await page.goto('http://localhost:3000');

    await page.click('[data-testid="create-agent-button"]');
    await page.fill('[name="agent-name"]', 'My Test Agent');
    await page.selectOption('[name="model"]', 'claude-sonnet');
    await page.click('[data-testid="submit"]');

    await expect(page.locator('text=My Test Agent')).toBeVisible();
  });
});
```

## Running Tests

### All tests
```bash
pnpm test
```

### Package-specific
```bash
pnpm --filter "@agentik-os/runtime" test
pnpm --filter "@agentik-os/dashboard" test
```

### Watch mode
```bash
pnpm test:watch
```

### Coverage
```bash
pnpm test:coverage
```

### E2E tests
```bash
pnpm test:e2e
```

## Coverage Requirements

| Package | Minimum Coverage | Current |
|---------|------------------|---------|
| runtime | 85% | TBD |
| dashboard | 75% | TBD |
| cli | 80% | TBD |
| sdk | 85% | TBD |
| shared | 90% | TBD |

## Test Checklist

When implementing a new feature:

- [ ] Unit tests for all functions/methods
- [ ] Integration tests for multi-component flows
- [ ] E2E tests for user-facing features
- [ ] Test edge cases and error handling
- [ ] Test coverage >80%
- [ ] All tests passing locally
- [ ] CI tests passing

## Mocking

### Anthropic API
```typescript
import { vi } from 'vitest';

vi.mock('@anthropic-ai/sdk', () => ({
  Anthropic: vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{ text: 'Mocked response' }]
      })
    }
  }))
}));
```

### Convex
```typescript
import { vi } from 'vitest';

const mockConvex = {
  query: vi.fn(),
  mutation: vi.fn(),
  action: vi.fn()
};

vi.mock('convex/react', () => ({
  useQuery: mockConvex.query,
  useMutation: mockConvex.mutation
}));
```

## Performance Testing

For performance-critical code:

```typescript
import { describe, it, expect } from 'vitest';
import { performance } from 'perf_hooks';

describe('Performance: Model Router', () => {
  it('should route within 100ms', async () => {
    const start = performance.now();

    await router.route(message);

    const duration = performance.now() - start;
    expect(duration).toBeLessThan(100);
  });
});
```

## Debugging Tests

### VS Code
Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Vitest Tests",
  "runtimeExecutable": "pnpm",
  "runtimeArgs": ["test", "--run", "${file}"],
  "console": "integratedTerminal"
}
```

### CLI
```bash
# Run specific test
pnpm test normalize.test.ts

# Debug mode
pnpm test --reporter=verbose

# Update snapshots
pnpm test -u
```

## Best Practices

1. **Test behavior, not implementation**
   - Focus on inputs/outputs, not internal state

2. **Use descriptive test names**
   - Good: `should return error when API key is invalid`
   - Bad: `test1`

3. **Arrange-Act-Assert pattern**
   ```typescript
   // Arrange
   const input = { ... };

   // Act
   const result = fn(input);

   // Assert
   expect(result).toBe(expected);
   ```

4. **One assertion per test** (when possible)
   - Makes failures easier to diagnose

5. **Mock external dependencies**
   - Don't hit real APIs in tests
   - Use test doubles for databases

6. **Clean up after tests**
   ```typescript
   afterEach(() => {
     vi.clearAllMocks();
   });
   ```

## CI/CD Integration

Tests run automatically on:
- Every push to `main` or `develop`
- Every pull request
- Before releases

**Requirements:**
- All tests must pass
- Coverage must meet thresholds
- No TypeScript errors
- Linting passes

---

**Questions?** Ask the testing-qa agent!
