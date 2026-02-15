# Vitest Configuration Templates

These are template Vitest configurations for each package in the monorepo.

**IMPORTANT:** These are TEMPLATES that must be COPIED (not symlinked) into each package when it's created.

## Usage

When creating a new package, copy the appropriate config template:

### Runtime Package
```bash
cp templates/vitest/runtime.vitest.config.ts packages/runtime/vitest.config.ts
```

### CLI Package
```bash
cp templates/vitest/cli.vitest.config.ts packages/cli/vitest.config.ts
```

### Dashboard Package
```bash
cp templates/vitest/dashboard.vitest.config.ts packages/dashboard/vitest.config.ts
```

## Package-Specific Setup

Each package should also create a `tests/setup.ts` file for test initialization.

**Template available:** Copy `templates/vitest/tests-setup-template.ts` to your package:

```bash
# When creating a package
mkdir -p packages/{package}/tests
cp templates/vitest/tests-setup-template.ts packages/{package}/tests/setup.ts
```

Or create manually:

```typescript
// packages/{package}/tests/setup.ts
import { beforeAll, afterAll, afterEach } from 'vitest';

beforeAll(() => {
  // Global setup
});

afterEach(() => {
  // Clean up after each test
});

afterAll(() => {
  // Global teardown
});
```

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm --filter "@agentik-os/runtime" test

# Run with coverage
pnpm test:ci

# Watch mode
pnpm --filter "@agentik-os/runtime" test:watch
```
