# Code Mode 💻

**Software development assistant optimized for code review, debugging, testing, and deployment.**

## Features

- **Code Review:** Deep analysis focusing on correctness, performance, security, and maintainability
- **Bug Hunting:** Systematic debugging with root cause analysis
- **Test Engineering:** Comprehensive test suites with high coverage
- **Refactoring:** Clean architecture and design patterns

## Agents

### 1. Code Reviewer
Expert code reviewer with 10+ years of experience. Reviews code quality, suggests improvements, enforces best practices.

**Specialties:**
- Security vulnerabilities (XSS, SQL injection, CSRF)
- Performance bottlenecks (O(n²) → O(n log n))
- Design patterns and SOLID principles
- Framework-specific best practices

### 2. Bug Hunter
Systematic debugging expert specializing in root cause analysis.

**Debugging Process:**
1. Reproduce the bug
2. Isolate the failing component
3. Analyze stack traces and logs
4. Test hypotheses
5. Implement fix with regression tests

### 3. Test Engineer
Test automation specialist focused on building comprehensive test suites.

**Testing Philosophy:**
- Unit Tests: 80%+ coverage on business logic
- Integration Tests: API contracts, database interactions
- E2E Tests: Critical user journeys

## Recommended Skills

- `file-operations` - Read/write code files
- `web-search` - Search documentation and Stack Overflow
- `git` - Version control operations
- `terminal` - Run build/test commands
- `code-search` - Search codebase for patterns

## Example Workflows

### Code Review (15-30 min)
```
1. Read PR description and requirements
2. Review changed files for correctness and security
3. Check test coverage and quality
4. Verify documentation is updated
5. Suggest improvements with code examples
6. Approve or request changes
```

### Debug Production Issue (1-3 hours)
```
1. Gather error logs, stack traces, and reproduction steps
2. Reproduce the bug locally
3. Analyze the code path and identify root cause
4. Write a failing test that captures the bug
5. Implement the fix
6. Verify tests pass and deploy with monitoring
```

### Add Feature with Tests (2-4 hours)
```
1. Write failing tests based on requirements
2. Implement minimal code to make tests pass
3. Refactor for clean code
4. Add integration tests
5. Update documentation
6. Create pull request with demo
```

## Usage

```typescript
import { codeModeConfig } from '@agentik-os/mode-code';

// Use the system prompt
console.log(codeModeConfig.systemPrompt);

// Get recommended skills
console.log(codeModeConfig.recommendedSkills);

// Access specialized agents
const codeReviewer = codeModeConfig.agents.find(a => a.role === 'code-reviewer');
console.log(codeReviewer.systemPrompt);
```

## Configuration

```typescript
{
  temperature: 0.3,        // Low temperature for precise code analysis
  maxTokens: 4096,         // Enough for detailed code reviews
  recommendedModel: "claude-sonnet-4-5-20250929"
}
```

## License

MIT
