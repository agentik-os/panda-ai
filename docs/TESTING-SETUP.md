# Testing Framework Setup

This document describes the testing infrastructure for Agentik OS.

## Tools

| Tool | Purpose | Packages |
|------|---------|----------|
| **Vitest** | Unit & integration tests | runtime, cli, sdk, shared |
| **Playwright** | E2E UI tests | dashboard |
| **Codecov** | Coverage reporting | All |

## Installation (Per Package)

### Vitest (for runtime, cli, sdk, shared)

```bash
cd packages/runtime  # or cli, sdk, shared

pnpm add -D vitest @vitest/coverage-v8 @types/node
```

**Add to `package.json`:**
```json
{
  "scripts": {
    "test": "vitest",
    "test:ci": "vitest run --coverage",
    "test:watch": "vitest watch",
    "test:coverage": "vitest run --coverage"
  }
}
```

**Create `vitest.config.ts`:**
Copy from `docs/configs/vitest.config.template.ts`

**Create `tests/setup.ts`:**
Copy from `docs/configs/test-setup.template.ts`

### Playwright (for dashboard only)

```bash
cd packages/dashboard

pnpm add -D @playwright/test
pnpm exec playwright install --with-deps chromium
```

**Add to `package.json`:**
```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

**Create `playwright.config.ts`:**
Copy from `docs/configs/playwright.config.template.ts`

## Directory Structure

### Runtime Package
```
packages/runtime/
├── src/
│   ├── pipeline/
│   │   ├── normalize.ts
│   │   └── normalize.test.ts       # Unit tests alongside code
│   ├── router/
│   │   ├── complexity.ts
│   │   └── complexity.test.ts
│   └── index.ts
├── tests/
│   ├── setup.ts                    # Test setup
│   └── integration/
│       └── pipeline.test.ts        # Integration tests
├── vitest.config.ts
└── package.json
```

### Dashboard Package
```
packages/dashboard/
├── app/
│   └── agents/
│       └── page.tsx
├── components/
│   ├── AgentCard.tsx
│   └── AgentCard.test.tsx          # Component tests
├── e2e/
│   ├── agents.spec.ts              # E2E tests
│   ├── dashboard.spec.ts
│   └── auth.spec.ts
├── playwright.config.ts
├── vitest.config.ts
└── package.json
```

## Running Tests

### From Root (All Packages)
```bash
pnpm test           # Run all tests
pnpm test:coverage  # With coverage
pnpm test:e2e       # E2E tests only
```

### From Package
```bash
cd packages/runtime
pnpm test           # Run tests for this package
pnpm test:watch     # Watch mode
pnpm test:coverage  # With coverage
```

### Specific Tests
```bash
# Run specific file
pnpm test normalize.test.ts

# Run tests matching pattern
pnpm test --grep "complexity"

# Debug mode
pnpm test --reporter=verbose
```

## Coverage Reports

After running `pnpm test:coverage`:
- **Console**: Summary in terminal
- **HTML**: `coverage/index.html` (open in browser)
- **JSON**: `coverage/coverage-final.json`
- **LCOV**: `coverage/lcov.info` (for CI)

## CI/CD Integration

Tests run automatically in GitHub Actions (`.github/workflows/ci.yml`):

1. **Quality Check**: Lint, typecheck, format
2. **Test Suite**: Unit + integration tests (parallel by package)
3. **Build**: Ensure everything compiles
4. **E2E**: Playwright tests on dashboard

**Requirements to Pass:**
- ✅ All tests passing
- ✅ Coverage >80%
- ✅ 0 TypeScript errors
- ✅ 0 linting errors

## Writing Your First Test

### 1. Create test file alongside implementation

```bash
# If you create src/pipeline/normalize.ts
# Also create src/pipeline/normalize.test.ts
```

### 2. Import Vitest utilities

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
```

### 3. Write tests

```typescript
import { describe, it, expect } from 'vitest';
import { calculateComplexity } from './complexity';

describe('calculateComplexity', () => {
  it('should return low score for simple messages', () => {
    const result = calculateComplexity('Hello');
    expect(result).toBeLessThan(30);
  });

  it('should return high score for complex messages', () => {
    const result = calculateComplexity(`
      Write a comprehensive analysis of the economic implications
      of distributed AI systems, including code examples and citations.
    `);
    expect(result).toBeGreaterThan(70);
  });
});
```

### 4. Run tests

```bash
pnpm test complexity.test.ts
```

## Best Practices

1. **Test behavior, not implementation**
2. **Use descriptive test names**
3. **Arrange-Act-Assert pattern**
4. **Mock external dependencies**
5. **One assertion per test** (when possible)
6. **Clean up after tests**

See [TESTING-GUIDE.md](./TESTING-GUIDE.md) for detailed best practices.

## Troubleshooting

### Tests not found
- Check file extension is `.test.ts` or `.spec.ts`
- Check `include` pattern in `vitest.config.ts`

### Import errors
- Check path aliases in `vitest.config.ts`
- Ensure dependencies are installed

### Timeout errors
- Increase `testTimeout` in `vitest.config.ts`
- Check for infinite loops or long-running operations

### Coverage not meeting threshold
- Add tests for uncovered lines
- Check `coverage.exclude` in config
- Run `pnpm test:coverage` to see report

---

**Setup Status:**

- [x] CI/CD workflows created
- [x] Testing guide written
- [x] Config templates ready
- [ ] Vitest installed (waiting for monorepo)
- [ ] Playwright installed (waiting for dashboard package)
- [ ] First tests written (waiting for code)

**Next Steps:** Once runtime package is scaffolded, install Vitest and create first test!
