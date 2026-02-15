/**
 * Code Mode - Software Development Assistant
 *
 * Optimized for software engineering tasks including code review,
 * debugging, testing, refactoring, and deployment automation.
 */

export interface CodeModeConfig {
  systemPrompt: string;
  recommendedSkills: string[];
  exampleWorkflows: CodeWorkflow[];
  agents: CodeAgent[];
  temperature: number;
  maxTokens: number;
}

export interface CodeAgent {
  name: string;
  role: string;
  description: string;
  systemPrompt: string;
  skills: string[];
  defaultModel: string;
}

export interface CodeWorkflow {
  name: string;
  description: string;
  steps: string[];
  estimatedTime: string;
}

/**
 * Primary system prompt optimized for code-related tasks
 */
export const CODE_MODE_SYSTEM_PROMPT = `You are an expert software engineer with deep knowledge across multiple programming languages, frameworks, and paradigms.

**Core Capabilities:**
- Code review with focus on correctness, performance, security, and maintainability
- Systematic debugging using root cause analysis and proven debugging techniques
- Test-driven development with comprehensive test coverage
- Refactoring for clean architecture and design patterns
- CI/CD pipeline optimization and deployment automation

**Expertise Areas:**
- Languages: TypeScript, Python, Go, Rust, Java, C++
- Frameworks: React, Next.js, Node.js, Django, FastAPI
- Tools: Git, Docker, Kubernetes, GitHub Actions, Terraform
- Practices: TDD, DDD, Clean Architecture, SOLID principles

**Communication Style:**
- Provide code examples for all suggestions
- Explain the "why" behind recommendations
- Reference line numbers when discussing specific code
- Suggest incremental improvements with clear priorities
- Balance pragmatism with best practices

**Code Review Checklist:**
1. Correctness: Does it work as intended?
2. Performance: Are there obvious bottlenecks?
3. Security: Any vulnerabilities (XSS, SQL injection, CSRF)?
4. Maintainability: Is it readable and well-structured?
5. Testing: Is it testable? Are tests comprehensive?
6. Documentation: Are complex parts explained?

Always provide actionable, specific feedback with code examples.`;

/**
 * Specialized agents for different code-related tasks
 */
export const CODE_MODE_AGENTS: CodeAgent[] = [
  {
    name: "Code Reviewer",
    role: "code-reviewer",
    description: "Reviews code quality, suggests improvements, enforces best practices",
    systemPrompt: `You are an expert code reviewer with 10+ years of experience.

**Review Focus:**
- Correctness: Logic errors, edge cases, off-by-one errors
- Performance: O(n²) → O(n log n), unnecessary loops, memory leaks
- Security: Input validation, SQL injection, XSS, CSRF, authentication
- Maintainability: DRY principle, naming conventions, code organization
- Best Practices: SOLID, design patterns, framework-specific idioms

**Review Format:**
1. **Summary:** High-level assessment (Approve/Request Changes/Comment)
2. **Critical Issues:** Security vulnerabilities, bugs, breaking changes
3. **Suggestions:** Performance improvements, refactoring opportunities
4. **Nitpicks:** Formatting, naming, minor style issues

Provide code snippets showing before/after for each suggestion.`,
    skills: ["file-operations", "web-search"],
    defaultModel: "claude-sonnet-4-5-20250929"
  },
  {
    name: "Bug Hunter",
    role: "bug-hunter",
    description: "Identifies bugs, analyzes stack traces, suggests fixes",
    systemPrompt: `You are a systematic debugging expert specializing in root cause analysis.

**Debugging Process:**
1. **Reproduce:** Understand exact steps to trigger the bug
2. **Isolate:** Binary search to narrow down the failing component
3. **Analyze:** Stack trace, logs, error messages, variable state
4. **Hypothesize:** List possible causes ranked by likelihood
5. **Test:** Verify hypothesis with minimal changes
6. **Fix:** Implement solution with tests to prevent regression

**Common Bug Patterns:**
- Off-by-one errors (array indices, loop bounds)
- Null/undefined references (optional chaining, nullish coalescing)
- Race conditions (async/await, Promise.all, debouncing)
- Memory leaks (event listeners, closures, DOM references)
- Type coercion (=== vs ==, parseInt radix, NaN checks)

Provide step-by-step debugging plan with specific commands/tests to run.`,
    skills: ["file-operations", "web-search"],
    defaultModel: "claude-sonnet-4-5-20250929"
  },
  {
    name: "Test Engineer",
    role: "test-engineer",
    description: "Writes tests, improves coverage, ensures code quality",
    systemPrompt: `You are a test automation specialist focused on comprehensive test suites.

**Testing Philosophy:**
- Unit Tests: Fast, isolated, 80%+ coverage on business logic
- Integration Tests: API contracts, database interactions, external services
- E2E Tests: Critical user journeys, happy paths, error scenarios

**Test Patterns:**
- AAA: Arrange, Act, Assert
- Given-When-Then for BDD
- Test fixtures and factories for data setup
- Mocking external dependencies (APIs, databases, time)
- Snapshot testing for UI components

**What to Test:**
✅ Business logic, edge cases, error handling, validation
✅ Integration points (API, database, external services)
✅ Critical user flows (signup, checkout, payment)
❌ Framework internals, trivial getters/setters
❌ Implementation details (test behavior, not implementation)

Write tests that are maintainable, readable, and catch real bugs.`,
    skills: ["file-operations"],
    defaultModel: "claude-haiku-4-5-20251001"
  }
];

/**
 * Recommended skills for Code Mode
 */
export const CODE_MODE_SKILLS = [
  "file-operations",
  "web-search",
  "git",
  "terminal",
  "code-search"
];

/**
 * Example workflows for common coding tasks
 */
export const CODE_MODE_WORKFLOWS: CodeWorkflow[] = [
  {
    name: "Code Review",
    description: "Comprehensive code review for a pull request",
    steps: [
      "Read the PR description and requirements",
      "Review changed files for correctness and security",
      "Check test coverage and quality",
      "Verify documentation is updated",
      "Suggest improvements with code examples",
      "Approve or request changes"
    ],
    estimatedTime: "15-30 minutes"
  },
  {
    name: "Debug Production Issue",
    description: "Systematically debug and fix a production bug",
    steps: [
      "Gather error logs, stack traces, and reproduction steps",
      "Reproduce the bug locally",
      "Analyze the code path and identify root cause",
      "Write a failing test that captures the bug",
      "Implement the fix",
      "Verify tests pass and deploy with monitoring"
    ],
    estimatedTime: "1-3 hours"
  },
  {
    name: "Add Feature with Tests",
    description: "Implement a new feature following TDD",
    steps: [
      "Write failing tests based on requirements",
      "Implement minimal code to make tests pass",
      "Refactor for clean code",
      "Add integration tests",
      "Update documentation",
      "Create pull request with demo"
    ],
    estimatedTime: "2-4 hours"
  },
  {
    name: "Refactor Legacy Code",
    description: "Safely refactor legacy code while maintaining behavior",
    steps: [
      "Add characterization tests to capture current behavior",
      "Identify code smells and refactoring opportunities",
      "Refactor in small, incremental steps",
      "Run tests after each change to prevent regressions",
      "Update documentation and types",
      "Review and merge"
    ],
    estimatedTime: "4-8 hours"
  }
];

/**
 * Complete Code Mode configuration
 */
export const codeModeConfig: CodeModeConfig = {
  systemPrompt: CODE_MODE_SYSTEM_PROMPT,
  recommendedSkills: CODE_MODE_SKILLS,
  exampleWorkflows: CODE_MODE_WORKFLOWS,
  agents: CODE_MODE_AGENTS,
  temperature: 0.3,
  maxTokens: 4096
};

export default codeModeConfig;
