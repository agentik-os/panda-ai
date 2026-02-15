# Contributing to Agentik OS

Thank you for contributing to Agentik OS! This document provides guidelines for contributing to the project.

## Development Setup

### Prerequisites

- **Node.js** 20+
- **pnpm** 8+
- **Bun** (for runtime package)
- **Git**

### Installation

```bash
# Clone the repository
git clone https://github.com/agentik-os/agentik-os.git
cd agentik-os

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test
```

## Project Structure

```
agentik-os/
├── packages/
│   ├── runtime/       # Core agent runtime (Bun)
│   ├── dashboard/     # Web UI (Next.js 16)
│   ├── cli/           # CLI tool (panda)
│   ├── sdk/           # Skill development SDK
│   └── shared/        # Shared types and utilities
├── docs/              # Documentation
└── .github/           # CI/CD workflows
```

## Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

### 2. Make Changes

- Write code following our style guide
- Add tests for new functionality
- Update documentation if needed

### 3. Run Quality Checks

```bash
# Lint
pnpm lint

# Type check
pnpm type-check

# Format
pnpm format

# Test
pnpm test

# Build
pnpm build
```

### 4. Commit Changes

We use conventional commits:

```bash
git commit -m "feat(runtime): add model router complexity scoring"
git commit -m "fix(dashboard): resolve agent list pagination bug"
git commit -m "docs(sdk): update skill creation guide"
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## Code Style

### TypeScript

- Use strict mode
- Prefer `type` over `interface` for simple types
- Use `interface` for extensible contracts
- Explicit return types for public APIs

```typescript
// Good
export function calculateComplexity(message: string): number {
  // ...
}

// Bad
export function calculateComplexity(message: string) {
  // ...
}
```

### Naming Conventions

- **Files**: kebab-case (`model-router.ts`)
- **Components**: PascalCase (`AgentCard.tsx`)
- **Functions**: camelCase (`normalizeMessage()`)
- **Constants**: SCREAMING_SNAKE_CASE (`MAX_RETRIES`)
- **Types**: PascalCase (`MessagePipeline`)

### Comments

```typescript
/**
 * Calculates message complexity score (0-100)
 *
 * @param message - The message to analyze
 * @returns Complexity score where 0-30 is simple, 31-70 is medium, 71-100 is complex
 */
export function calculateComplexity(message: string): number {
  // Implementation
}
```

## Testing

### Required Tests

Every new feature must include:

1. **Unit tests** - Test individual functions/methods
2. **Integration tests** - Test component interactions
3. **E2E tests** - Test user-facing features (dashboard only)

### Test Coverage

- **Minimum:** 80% overall
- **Target:** 90%+ for core packages (runtime, shared)

See [TESTING-GUIDE.md](docs/TESTING-GUIDE.md) for details.

## Documentation

### When to Update Docs

- Adding new features → Update relevant docs in `docs/`
- Changing APIs → Update API documentation
- Adding new packages → Create package README
- Fixing bugs → Add to CHANGELOG

### Documentation Structure

```
docs/
├── PRD.md                    # Product requirements
├── ARCHITECTURE.md           # System architecture
├── USER-GUIDE.md             # End-user guide
├── TESTING-GUIDE.md          # Testing guide
├── API/                      # API documentation
│   ├── runtime.md
│   ├── sdk.md
│   └── cli.md
└── TUTORIALS/                # Step-by-step guides
    ├── first-agent.md
    └── first-skill.md
```

## Pull Request Guidelines

### PR Title

Use conventional commit format:
```
feat(runtime): add Ollama provider support
fix(dashboard): resolve infinite scroll bug
docs(sdk): add custom MCP server tutorial
```

### PR Description

Include:
- **What**: Brief description of changes
- **Why**: Motivation and context
- **How**: Technical approach
- **Testing**: How you tested the changes
- **Screenshots**: For UI changes

### PR Checklist

Before submitting:

- [ ] Code follows project style guide
- [ ] Tests added and passing
- [ ] Documentation updated
- [ ] TypeScript compiles with no errors
- [ ] Linting passes
- [ ] No console errors in browser (for dashboard)
- [ ] Tested at 375px, 768px, 1440px (for dashboard)

## Review Process

1. **Automated Checks**: CI runs linting, type checking, tests, build
2. **Code Review**: At least one team member reviews
3. **Guardian Verification**: Guardian agent verifies quality
4. **Merge**: PR merged to `main`

## Release Process

We use semantic versioning (MAJOR.MINOR.PATCH):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backwards compatible)
- **PATCH**: Bug fixes

Releases are automated via GitHub Actions when tags are pushed.

## Getting Help

- **Discord**: [Join our community](https://discord.gg/agentik-os)
- **GitHub Issues**: Report bugs or request features
- **Documentation**: Check `docs/` directory

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the code, not the person
- Help newcomers

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Agentik OS! 🚀
