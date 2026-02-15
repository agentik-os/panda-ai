# Create a Custom OS Mode

> **10-minute tutorial: Build a specialized OS mode tailored to your needs**

Learn by creating a "Code Review" OS mode that gives your agents specific behavior, prompts, and constraints optimized for reviewing code.

---

## What You'll Build

By the end of this tutorial, you'll have:

- ✅ A custom "Code Review" OS mode configured
- ✅ Specialized system prompts and constraints
- ✅ The mode deployed and active on an agent
- ✅ Understanding of how to create any custom mode

**Time:** 10 minutes
**Difficulty:** Intermediate
**Prerequisites:** Agentik OS dashboard access or CLI installed

---

## Understanding OS Modes

**OS Modes** control how agents think and behave:

| Built-in Mode | Temperature | Max Tokens | Best For |
|--------------|-------------|------------|----------|
| **Focus** | 0.3 | 2048 | Fast, deterministic tasks |
| **Creative** | 0.9 | 4096 | Brainstorming, writing |
| **Research** | 0.5 | 8192 | Analysis, investigation |

**Custom modes** let you create specialized behavior for specific use cases.

---

## Step 1: Define Mode Requirements (2 minutes)

For our **Code Review** mode, we want:

- **Behavior:** Thorough, critical, constructive
- **Temperature:** 0.4 (consistent but not robotic)
- **Max Tokens:** 4096 (detailed feedback)
- **System Prompt:** Emphasize best practices, security, performance
- **Constraints:** Always check for common bugs, suggest improvements

Create a requirements file `code-review-mode.yaml`:

```yaml
name: Code Review
id: mode_code_review
description: Thorough code review with focus on quality, security, and performance

# Model configuration
model:
  temperature: 0.4
  maxTokens: 4096
  topP: 0.95

# Behavior constraints
constraints:
  minReviewTime: 30        # Seconds to spend analyzing
  requireTests: true       # Flag missing tests
  securityScan: true       # Check for vulnerabilities
  performanceCheck: true   # Look for inefficiencies

# Review checklist (enforced)
checklist:
  - Code style and formatting
  - Error handling
  - Edge cases
  - Security vulnerabilities
  - Performance bottlenecks
  - Test coverage
  - Documentation quality
  - Breaking changes
```

---

## Step 2: Write System Prompt (3 minutes)

Create `code-review-prompt.md`:

```markdown
# Code Review OS Mode

You are an expert code reviewer with 15+ years of experience.

## Your Mission

Provide thorough, constructive code reviews that help developers write better code.

## Review Philosophy

- **Thoroughness over speed** - Take time to understand context
- **Constructive feedback** - Suggest improvements, don't just criticize
- **Prioritize issues** - CRITICAL → HIGH → MEDIUM → LOW
- **Explain the why** - Teach, don't just point out problems
- **Praise good code** - Acknowledge well-written code

## Required Checks

For EVERY code review, you MUST:

1. **Security**
   - SQL injection, XSS, CSRF vulnerabilities
   - Authentication/authorization issues
   - Sensitive data exposure
   - Dependency vulnerabilities

2. **Performance**
   - Inefficient algorithms (O(n²) → O(n log n))
   - N+1 queries
   - Memory leaks
   - Unnecessary re-renders (React)

3. **Error Handling**
   - Unhandled promises
   - Missing try-catch
   - Poor error messages
   - No fallback behavior

4. **Code Quality**
   - DRY violations
   - Complex functions (>50 lines)
   - Magic numbers
   - Unclear variable names

5. **Testing**
   - Missing test coverage
   - Edge cases not tested
   - Flaky tests
   - Missing integration tests

6. **Breaking Changes**
   - API contract changes
   - Database schema changes
   - Configuration changes

## Output Format

Structure your review as:

### Summary
[One-sentence verdict: APPROVE / REQUEST CHANGES / REJECT]

### Critical Issues (🚨)
[Blocking issues - must fix before merge]

### High Priority (⚠️)
[Important but not blocking]

### Medium Priority (💡)
[Improvements and suggestions]

### Low Priority (📝)
[Nice-to-haves and nitpicks]

### Praise (✅)
[What was done well]

### Recommendations
[Next steps and learning resources]

## Examples

### Good Review
"The caching implementation is excellent - using Redis with proper TTL. However, there's a critical SQL injection vulnerability on line 47 where user input is concatenated directly into the query. Use parameterized queries instead."

### Bad Review
"This code is bad. Rewrite it."

## Remember

Your goal is to make the codebase better AND the developer better.
```

---

## Step 3: Create the Mode (3 minutes)

### Option 1: Dashboard

1. Go to **Settings** → **OS Modes**
2. Click **Create Custom Mode**
3. Fill in the form:
   - **Name:** Code Review
   - **ID:** `mode_code_review`
   - **Temperature:** 0.4
   - **Max Tokens:** 4096
4. Paste the system prompt
5. Add constraints from YAML
6. Click **Create**

### Option 2: CLI

```bash
# Create mode from files
panda mode create \
  --name "Code Review" \
  --id mode_code_review \
  --config code-review-mode.yaml \
  --prompt code-review-prompt.md
```

### Option 3: API

```typescript
import { Agentik } from '@agentik/sdk';

const agentik = new Agentik({ apiKey: process.env.AGENTIK_API_KEY });

const mode = await agentik.modes.create({
  name: 'Code Review',
  id: 'mode_code_review',
  description: 'Thorough code review with focus on quality, security, and performance',
  config: {
    model: {
      temperature: 0.4,
      maxTokens: 4096,
      topP: 0.95,
    },
    constraints: {
      minReviewTime: 30,
      requireTests: true,
      securityScan: true,
      performanceCheck: true,
    },
    checklist: [
      'Code style and formatting',
      'Error handling',
      'Edge cases',
      'Security vulnerabilities',
      'Performance bottlenecks',
      'Test coverage',
      'Documentation quality',
      'Breaking changes',
    ],
  },
  systemPrompt: `
# Code Review OS Mode

You are an expert code reviewer with 15+ years of experience.

[... full prompt ...]
  `,
});

console.log('Mode created:', mode.id);
```

---

## Step 4: Assign to Agent (1 minute)

### Via Dashboard

1. Go to **Agents** → Select your agent
2. Click **Edit**
3. Under **OS Mode**, select **Code Review**
4. Click **Save**

### Via CLI

```bash
panda agent update agent_abc123 \
  --mode mode_code_review
```

### Via API

```typescript
await agentik.agents.update(agentId, {
  mode: 'mode_code_review',
});
```

---

## Step 5: Test the Mode (1 minute)

Chat with your agent and submit code for review:

**You:**
```javascript
async function getUser(id) {
  const user = await db.query('SELECT * FROM users WHERE id = ' + id);
  return user;
}
```

**Agent (in Code Review mode):**

```
### Summary
🚨 REJECT - Critical security vulnerability detected

### Critical Issues (🚨)

**SQL Injection Vulnerability (Line 2)**
The user ID is concatenated directly into the SQL query, making this vulnerable to SQL injection attacks. An attacker could pass `"1 OR 1=1"` to dump the entire users table.

**Fix:**
```javascript
async function getUser(id) {
  const user = await db.query('SELECT * FROM users WHERE id = $1', [id]);
  return user;
}
```

**Missing Error Handling**
No try-catch block means errors will crash the application.

**Fix:**
```javascript
async function getUser(id) {
  try {
    const user = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  } catch (error) {
    logger.error('Failed to fetch user', { id, error });
    throw error;
  }
}
```

### High Priority (⚠️)

**No Input Validation**
The function doesn't validate that `id` is a valid format (e.g., UUID or integer).

**Suggested addition:**
```javascript
if (!id || typeof id !== 'string') {
  throw new Error('Invalid user ID');
}
```

### Medium Priority (💡)

**Missing Type Safety**
Consider using TypeScript and defining interfaces:
```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

async function getUser(id: string): Promise<User> {
  // ...
}
```

### Recommendations

1. Read OWASP Top 10 on SQL Injection
2. Implement a query builder (Prisma, Drizzle)
3. Add integration tests with a test database
4. Set up static analysis (ESLint security plugin)

**Estimated time to fix:** 15 minutes
```

✅ **Your custom mode is working!**

---

## Advanced Configurations

### Add Tool Restrictions

Limit which skills the mode can use:

```yaml
tools:
  allowList:
    - code-analysis
    - security-scan
    - performance-profiler
  denyList:
    - web-search    # No searching during code review
    - file-write    # Read-only mode
```

### Add Cost Guardrails

Prevent expensive operations:

```yaml
budget:
  maxCostPerReview: 0.05    # Max $0.05 per code review
  maxTokensPerReview: 8000  # Hard limit

  # Auto-switch to cheaper model if over budget
  fallbackModel: claude-sonnet-4-5
```

### Add Context Windows

Define what context the mode can see:

```yaml
context:
  maxFiles: 10              # Max files to analyze at once
  maxLinesPerFile: 500      # Truncate large files
  includeHistory: false     # Don't look at git history
  includeDependencies: true # Check package.json
```

### Add Formatting Rules

Enforce output structure:

```yaml
output:
  format: structured        # JSON, Markdown, or Plain
  template: code-review     # Use predefined template
  includeMetrics: true      # Add complexity scores

  metrics:
    - cyclomaticComplexity
    - linesOfCode
    - testCoverage
    - securityScore
```

---

## More Custom Mode Examples

### 1. Customer Support Mode

```yaml
name: Customer Support
temperature: 0.6
maxTokens: 2048

systemPrompt: |
  You are a friendly, empathetic customer support agent.

  - Always start with empathy
  - Ask clarifying questions
  - Provide step-by-step solutions
  - End with "Is there anything else I can help with?"

  Tone: Warm, patient, professional

constraints:
  maxResponseTime: 30s
  requireSolution: true
  escalateKeywords:
    - refund
    - legal
    - lawsuit
```

### 2. Data Analysis Mode

```yaml
name: Data Analysis
temperature: 0.2
maxTokens: 8192

systemPrompt: |
  You are a data scientist specializing in exploratory data analysis.

  For every dataset:
  1. Summary statistics
  2. Distribution analysis
  3. Outlier detection
  4. Correlation analysis
  5. Visualization recommendations
  6. Statistical tests

  Always show Python code for reproducibility.

constraints:
  requireVisualization: true
  showStatisticalSignificance: true
  explainAssumptions: true
```

### 3. Content Writing Mode

```yaml
name: Content Writing
temperature: 0.8
maxTokens: 4096

systemPrompt: |
  You are a professional content writer specializing in SaaS marketing.

  Writing principles:
  - Hook in first sentence
  - Short paragraphs (2-3 sentences)
  - Active voice
  - Specific examples
  - Strong CTAs

  SEO requirements:
  - Target keyword in H1, first paragraph, conclusion
  - Internal links
  - Meta description

style:
  tone: professional-casual
  readingLevel: 8th-grade
  sentenceLength: short
```

---

## Mode Switching Strategies

### Manual Switching

```bash
# Switch mode for one agent
panda agent update agent_abc123 --mode mode_code_review

# Switch back to default
panda agent update agent_abc123 --mode focus
```

### Automatic Switching (Triggers)

```yaml
# In agent config
autoModeSwitch:
  - trigger: message.contains('review this code')
    switchTo: mode_code_review

  - trigger: message.contains('write a blog post')
    switchTo: mode_content_writing

  - trigger: message.contains('analyze this data')
    switchTo: mode_data_analysis
```

### Context-Based Switching

```yaml
# Switch based on file type
autoModeSwitch:
  - trigger: file.extension == '.py' || file.extension == '.js'
    switchTo: mode_code_review

  - trigger: file.extension == '.csv'
    switchTo: mode_data_analysis

  - trigger: file.extension == '.md'
    switchTo: mode_content_writing
```

---

## Testing Your Mode

### Create Test Cases

```yaml
# test-cases.yaml
testCases:
  - name: SQL Injection Detection
    input: |
      async function login(username, password) {
        return db.query(`SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`);
      }
    expectedOutput:
      severity: CRITICAL
      issue: SQL Injection

  - name: Missing Error Handling
    input: |
      async function fetchUser(id) {
        const response = await fetch(`/api/users/${id}`);
        return response.json();
      }
    expectedOutput:
      severity: HIGH
      issue: Missing error handling
```

### Run Tests

```bash
panda mode test mode_code_review --test-cases test-cases.yaml
```

**Expected output:**

```
Running tests for mode: Code Review
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Test 1: SQL Injection Detection
   Detected: CRITICAL - SQL Injection

✅ Test 2: Missing Error Handling
   Detected: HIGH - Missing error handling

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Results: 2/2 passed (100%)
```

---

## Troubleshooting

### Mode Not Applied

**Symptom:** Agent still uses default behavior

**Solutions:**
1. Check agent config: `panda agent get agent_abc123`
2. Verify mode exists: `panda mode list`
3. Restart agent runtime: `panda agent restart agent_abc123`

### Mode Too Strict/Lenient

**Symptom:** Agent flags everything or misses issues

**Solution:** Adjust temperature:
- Too strict (false positives) → Increase temperature (0.4 → 0.6)
- Too lenient (false negatives) → Decrease temperature (0.6 → 0.4)

### Mode Too Expensive

**Symptom:** High costs from long reviews

**Solutions:**
1. Reduce `maxTokens` (4096 → 2048)
2. Add `maxCostPerReview` budget constraint
3. Use cheaper fallback model

### Inconsistent Reviews

**Symptom:** Different results for same code

**Solution:** Lower temperature for consistency:
```yaml
temperature: 0.2  # Very deterministic
```

---

## Summary

You've learned:

- ✅ How to define custom OS mode requirements
- ✅ How to write specialized system prompts
- ✅ How to configure model parameters and constraints
- ✅ How to deploy and test custom modes
- ✅ How to create modes for different use cases
- ✅ How to troubleshoot mode behavior

**Next Tutorials:**

1. [Multi-Agent Consensus](./multi-agent-consensus.md)
2. [Deploy to Kubernetes](./kubernetes-deployment.md)
3. [Telegram Bot Integration](./telegram-integration.md)

**Resources:**

- 📚 [OS Modes Guide](../guides/os-modes.md)
- 🛠️ [Agent Configuration Reference](../guides/agent-configuration.md)
- 💬 Discord: [discord.gg/agentik-os](https://discord.gg/agentik-os)

---

*Last updated: February 14, 2026*
*Agentik OS Tutorial Team*
