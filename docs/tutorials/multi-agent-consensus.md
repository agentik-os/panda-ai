# Multi-Agent Consensus Setup

> **15-minute tutorial: Build a system where multiple AI agents collaborate and vote on decisions**

Learn by creating a consensus system for code review where 3 agents independently review code, then vote on whether to approve the changes.

---

## What You'll Build

By the end of this tutorial, you'll have:

- ✅ 3 specialized review agents (Security, Performance, Quality)
- ✅ A consensus coordinator agent
- ✅ Voting mechanism with configurable thresholds
- ✅ Complete multi-agent code review workflow

**Time:** 15 minutes
**Difficulty:** Advanced
**Prerequisites:** Agentik OS installed, basic understanding of agents

---

## Why Multi-Agent Consensus?

**Single Agent Problems:**
- Blind spots and biases
- Single point of failure
- Limited expertise breadth

**Multi-Agent Benefits:**
- ✅ Diverse perspectives reduce blind spots
- ✅ Higher confidence through majority voting
- ✅ Specialized agents = deeper expertise
- ✅ Fault tolerance (one agent failing doesn't block process)

**Use Cases:**
- Code review approval
- Content moderation
- Medical diagnosis validation
- Financial decision-making
- Legal document review

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│              Consensus Coordinator                   │
│  (Orchestrates voting, aggregates results)          │
└─────────────────┬───────────────────────────────────┘
                  │
        ┌─────────┴─────────┬─────────────┐
        │                   │             │
┌───────▼────────┐  ┌───────▼──────┐  ┌──▼──────────┐
│ Security Agent │  │ Performance  │  │ Code Quality│
│  (Opus 4.6)    │  │ Agent        │  │ Agent       │
│                │  │ (Sonnet 4.5) │  │(Sonnet 4.5) │
└────────────────┘  └──────────────┘  └─────────────┘
        │                   │             │
        └─────────┬─────────┴─────────────┘
                  │
           ┌──────▼────────┐
           │ Voting System │
           │ (2/3 minimum) │
           └───────────────┘
```

---

## Step 1: Create Specialized Agents (5 minutes)

### Security Agent

```bash
panda agent create \
  --name "Security Reviewer" \
  --id agent_security_review \
  --model claude-opus-4-6 \
  --mode focus \
  --system-prompt "
You are a security expert specialized in vulnerability detection.

Your ONLY job: Find security issues.

For every code review, check:
- SQL injection
- XSS vulnerabilities
- CSRF vulnerabilities
- Authentication/authorization flaws
- Sensitive data exposure
- Cryptography misuse
- Dependency vulnerabilities

Vote: APPROVE or REJECT
Provide: Severity (CRITICAL/HIGH/MEDIUM/LOW) and explanation
"
```

### Performance Agent

```bash
panda agent create \
  --name "Performance Reviewer" \
  --id agent_performance_review \
  --model claude-sonnet-4-5 \
  --mode focus \
  --system-prompt "
You are a performance optimization expert.

Your ONLY job: Find performance issues.

For every code review, check:
- Algorithm complexity (O(n²) → O(n log n))
- N+1 queries
- Memory leaks
- Unnecessary re-renders
- Inefficient data structures
- Missing caching
- Slow database queries

Vote: APPROVE or REJECT
Provide: Impact (HIGH/MEDIUM/LOW) and explanation
"
```

### Code Quality Agent

```bash
panda agent create \
  --name "Quality Reviewer" \
  --id agent_quality_review \
  --model claude-sonnet-4-5 \
  --mode focus \
  --system-prompt "
You are a code quality expert.

Your ONLY job: Assess code maintainability.

For every code review, check:
- Code style and formatting
- DRY violations
- Complex functions (>50 lines)
- Unclear variable names
- Missing error handling
- Test coverage
- Documentation quality

Vote: APPROVE or REJECT
Provide: Priority (HIGH/MEDIUM/LOW) and explanation
"
```

---

## Step 2: Create Consensus Coordinator (3 minutes)

```bash
panda agent create \
  --name "Consensus Coordinator" \
  --id agent_consensus_coordinator \
  --model claude-opus-4-6 \
  --mode research \
  --system-prompt "
You are a consensus coordinator for code reviews.

Your job:
1. Send code to 3 specialized agents (security, performance, quality)
2. Collect their votes (APPROVE/REJECT)
3. Aggregate results
4. Make final decision based on voting rules

Voting Rules:
- Minimum 2/3 APPROVE required to pass
- Any CRITICAL security issue = auto-REJECT
- Tie-breaking: defer to security agent

Output Format:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONSENSUS REVIEW RESULTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Security Agent:** [APPROVE/REJECT]
[Summary]

**Performance Agent:** [APPROVE/REJECT]
[Summary]

**Quality Agent:** [APPROVE/REJECT]
[Summary]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**FINAL DECISION:** [APPROVE/REJECT]
**Vote Count:** X/3 APPROVE
**Reasoning:** [Why this decision was made]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"
```

---

## Step 3: Configure Consensus Rules (2 minutes)

Create `consensus-config.yaml`:

```yaml
consensus:
  # Voting configuration
  voting:
    minimumApproval: 2/3         # 2 out of 3 agents must approve
    unanimousForCritical: true   # CRITICAL issues require unanimous fix
    tieBreaker: security         # security agent breaks ties

  # Agent weights (optional - all equal by default)
  weights:
    security: 1.5    # Security votes count 1.5x
    performance: 1.0
    quality: 1.0

  # Auto-reject conditions
  autoReject:
    - condition: security.severity == CRITICAL
      reason: Critical security vulnerability detected

    - condition: performance.impact == HIGH && quality.vote == REJECT
      reason: Both performance and quality concerns

  # Auto-approve conditions
  autoApprove:
    - condition: all.vote == APPROVE && all.issuesCount == 0
      reason: Unanimous approval with no issues

  # Timeout settings
  timeout:
    perAgent: 60s        # Max 60s per agent review
    total: 180s          # Max 3 minutes for entire consensus process

  # Retry settings
  retry:
    maxAttempts: 3       # Retry failed agents up to 3 times
    backoff: exponential # exponential backoff (1s, 2s, 4s)
```

Apply configuration:

```bash
panda agent update agent_consensus_coordinator \
  --config consensus-config.yaml
```

---

## Step 4: Implement Consensus Workflow (3 minutes)

### Via SDK

```typescript
import { Agentik, ConsensusBuilder } from '@agentik/sdk';

const agentik = new Agentik({ apiKey: process.env.AGENTIK_API_KEY });

// Initialize consensus system
const consensus = new ConsensusBuilder()
  .addAgent('agent_security_review', { weight: 1.5 })
  .addAgent('agent_performance_review', { weight: 1.0 })
  .addAgent('agent_quality_review', { weight: 1.0 })
  .setCoordinator('agent_consensus_coordinator')
  .setVotingRule('2/3') // 2 out of 3 must approve
  .setAutoReject([
    {
      condition: (results) =>
        results.security.severity === 'CRITICAL',
      reason: 'Critical security vulnerability',
    },
  ])
  .setTimeout(180000) // 3 minutes
  .build();

// Run consensus review
async function reviewCode(code: string) {
  const result = await consensus.execute({
    input: code,
    metadata: {
      pullRequestId: 'PR-123',
      author: 'developer@example.com',
    },
  });

  console.log('Final Decision:', result.decision); // APPROVE or REJECT
  console.log('Vote Count:', result.voteCount);    // e.g., "2/3"
  console.log('Agent Results:', result.agents);

  // Individual agent results
  result.agents.forEach((agent) => {
    console.log(`${agent.name}: ${agent.vote}`);
    console.log(`  Issues: ${agent.issues.length}`);
    console.log(`  Reasoning: ${agent.reasoning}`);
  });

  return result;
}

// Example usage
const code = `
async function login(username, password) {
  const user = await db.query('SELECT * FROM users WHERE username = ' + username);
  return user;
}
`;

const review = await reviewCode(code);
```

### Via CLI

```bash
# Run consensus review on a file
panda consensus review ./src/auth.js \
  --agents agent_security_review,agent_performance_review,agent_quality_review \
  --coordinator agent_consensus_coordinator \
  --rule 2/3

# Output:
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CONSENSUS REVIEW RESULTS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#
# **Security Agent:** REJECT
# Found CRITICAL SQL injection vulnerability on line 2
#
# **Performance Agent:** APPROVE
# No significant performance issues detected
#
# **Quality Agent:** REJECT
# Missing error handling and input validation
#
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# **FINAL DECISION:** REJECT
# **Vote Count:** 1/3 APPROVE
# **Reasoning:** Failed to meet 2/3 approval threshold. Critical security issue detected.
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Step 5: Test the System (2 minutes)

### Test Case 1: Clean Code (Should APPROVE)

```javascript
// test-code-clean.js
async function getUser(id: string): Promise<User> {
  try {
    // Parameterized query prevents SQL injection
    const user = await db.query(
      'SELECT id, name, email FROM users WHERE id = $1',
      [id]
    );

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  } catch (error) {
    logger.error('Failed to fetch user', { id, error });
    throw error;
  }
}
```

**Expected Result:**
```
Security Agent: APPROVE (No vulnerabilities)
Performance Agent: APPROVE (Efficient query)
Quality Agent: APPROVE (Well-structured, error handling present)

FINAL DECISION: APPROVE (3/3)
```

### Test Case 2: Vulnerable Code (Should REJECT)

```javascript
// test-code-vulnerable.js
async function login(username, password) {
  const user = await db.query(
    'SELECT * FROM users WHERE username = ' + username +
    ' AND password = ' + password
  );
  return user;
}
```

**Expected Result:**
```
Security Agent: REJECT (CRITICAL: SQL injection)
Performance Agent: APPROVE (Simple query)
Quality Agent: REJECT (No error handling, no validation)

FINAL DECISION: REJECT (1/3, CRITICAL security issue)
```

### Test Case 3: Performance Issue (May APPROVE or REJECT)

```javascript
// test-code-performance.js
async function getAllUsersWithPosts() {
  const users = await db.query('SELECT * FROM users');

  for (const user of users) {
    user.posts = await db.query('SELECT * FROM posts WHERE user_id = $1', [user.id]);
  }

  return users;
}
```

**Expected Result:**
```
Security Agent: APPROVE (No security issues)
Performance Agent: REJECT (N+1 query problem)
Quality Agent: APPROVE (Code is readable)

FINAL DECISION: REJECT (1/3, failed threshold)
```

Run tests:

```bash
panda consensus test \
  --test-dir ./test-cases \
  --config consensus-config.yaml
```

---

## Advanced Configurations

### Weighted Voting

Give more importance to certain agents:

```yaml
weights:
  security: 2.0     # Security vote counts 2x
  performance: 1.0
  quality: 1.0

# Now only security + one other needed
# security (2.0) + performance (1.0) = 3.0 / 4.0 = 75% ✅
```

### Hierarchical Consensus

Create multiple layers of review:

```yaml
layers:
  - name: Initial Review
    agents:
      - agent_security_review
      - agent_performance_review
    rule: 2/2  # Both must approve to proceed

  - name: Quality Gate
    agents:
      - agent_quality_review
      - agent_documentation_review
    rule: 1/2  # At least one must approve

  - name: Final Approval
    agents:
      - agent_senior_architect
    rule: 1/1  # Must approve
```

### Conditional Agent Selection

Choose agents dynamically based on code:

```yaml
agentSelection:
  - condition: file.extension == '.sql'
    agents:
      - agent_database_expert
      - agent_security_review

  - condition: file.path.includes('payment')
    agents:
      - agent_security_review
      - agent_compliance_review
      - agent_pci_dss_review

  - condition: file.path.includes('ui/')
    agents:
      - agent_ux_review
      - agent_accessibility_review
```

### Parallel vs Sequential Review

**Parallel (default):** All agents review simultaneously

```yaml
execution:
  mode: parallel
  timeout: 60s  # All agents run in parallel, max 60s total
```

**Sequential:** Agents review one after another

```yaml
execution:
  mode: sequential
  order:
    - agent_security_review      # First (critical)
    - agent_performance_review   # Second
    - agent_quality_review       # Third

  earlyExit: true  # Stop if critical issue found
```

---

## Real-World Use Cases

### 1. Pull Request Approval

```typescript
// GitHub webhook integration
app.post('/webhook/pr', async (req, res) => {
  const { pull_request } = req.body;

  // Get changed files
  const files = await github.getChangedFiles(pull_request.number);

  // Run consensus review
  const result = await consensus.execute({
    input: files,
    metadata: {
      prNumber: pull_request.number,
      author: pull_request.user.login,
      branch: pull_request.head.ref,
    },
  });

  // Post result as comment
  await github.createComment(pull_request.number, formatResult(result));

  // Update PR status
  if (result.decision === 'APPROVE') {
    await github.setStatus(pull_request.head.sha, 'success');
  } else {
    await github.setStatus(pull_request.head.sha, 'failure');
  }

  res.json({ success: true });
});
```

### 2. Content Moderation

```typescript
const contentConsensus = new ConsensusBuilder()
  .addAgent('agent_toxic_language', { weight: 2.0 })
  .addAgent('agent_spam_detection', { weight: 1.0 })
  .addAgent('agent_policy_violation', { weight: 1.5 })
  .setVotingRule('2/3')
  .setAutoReject([
    {
      condition: (r) => r.toxic_language.severity === 'HIGH',
      reason: 'High toxicity detected',
    },
  ])
  .build();

async function moderateComment(comment: string) {
  const result = await contentConsensus.execute({ input: comment });

  if (result.decision === 'REJECT') {
    await db.comments.update(comment.id, { status: 'hidden' });
    await notifyUser(comment.author, 'Comment hidden', result.reasoning);
  }

  return result;
}
```

### 3. Medical Diagnosis Validation

```typescript
const diagnosisConsensus = new ConsensusBuilder()
  .addAgent('agent_radiologist_1', { weight: 1.0 })
  .addAgent('agent_radiologist_2', { weight: 1.0 })
  .addAgent('agent_radiologist_3', { weight: 1.0 })
  .setVotingRule('2/3')
  .setMetadata({
    requireUnanimousForCritical: true,
    flagDisagreements: true,
  })
  .build();

async function diagnoseScan(scanImage: string) {
  const result = await diagnosisConsensus.execute({
    input: scanImage,
    metadata: { patientId: 'P-12345', scanType: 'MRI' },
  });

  // If unanimous, high confidence
  if (result.voteCount === '3/3') {
    return { diagnosis: result.consensus, confidence: 'HIGH' };
  }

  // If 2/3, flag for human review
  if (result.voteCount === '2/3') {
    await flagForHumanReview(result);
    return { diagnosis: result.consensus, confidence: 'MEDIUM' };
  }

  // If no consensus, escalate
  await escalateToSeniorRadiologist(result);
  return { diagnosis: null, confidence: 'LOW', action: 'ESCALATED' };
}
```

---

## Monitoring Consensus Performance

### Track Metrics

```typescript
const metrics = await consensus.getMetrics();

console.log(metrics);
// {
//   totalReviews: 1543,
//   approvalRate: 0.67,        // 67% approved
//   avgReviewTime: 45.2,       // seconds
//   agentAgreement: {
//     security_performance: 0.82,   // 82% agreement
//     security_quality: 0.75,
//     performance_quality: 0.88,
//   },
//   mostCommonIssues: [
//     { type: 'missing_error_handling', count: 234 },
//     { type: 'sql_injection', count: 67 },
//     { type: 'n_plus_one_query', count: 54 },
//   ],
// }
```

### Dashboard Integration

```typescript
// Convex realtime dashboard
export const consensusMetrics = query({
  handler: async (ctx) => {
    const reviews = await ctx.db.query('consensus_reviews').collect();

    return {
      total: reviews.length,
      approved: reviews.filter((r) => r.decision === 'APPROVE').length,
      rejected: reviews.filter((r) => r.decision === 'REJECT').length,
      avgTime: reviews.reduce((sum, r) => sum + r.duration, 0) / reviews.length,
      topIssues: aggregateIssues(reviews),
    };
  },
});
```

---

## Troubleshooting

### Agents Disagreeing Too Often

**Symptom:** Vote count often 1/3 or 2/3, rarely unanimous

**Solutions:**
1. Align system prompts (ensure consistent criteria)
2. Add shared evaluation rubric
3. Provide more examples in prompts
4. Use same model for all agents (reduce variance)

### Reviews Taking Too Long

**Symptom:** Consensus process exceeds timeout

**Solutions:**
1. Reduce `maxTokens` for each agent
2. Use faster models (Sonnet instead of Opus)
3. Switch to parallel execution
4. Add early exit for critical issues

### One Agent Always Rejecting

**Symptom:** Security agent rejects 90% of reviews

**Solutions:**
1. Review agent's system prompt (may be too strict)
2. Adjust voting weights
3. Change voting rule (require 3/3 instead of 2/3)
4. Add calibration examples to prompt

### High Cost Per Review

**Symptom:** Consensus reviews cost $0.50+ each

**Solutions:**
1. Use cheaper models (Sonnet, Haiku)
2. Reduce max tokens per agent
3. Add early exit conditions
4. Cache common code patterns

---

## Summary

You've learned:

- ✅ How to create specialized review agents
- ✅ How to configure voting rules and thresholds
- ✅ How to build a consensus coordinator
- ✅ How to implement weighted voting
- ✅ How to handle tie-breaking and auto-reject rules
- ✅ How to monitor consensus performance
- ✅ Real-world use cases for multi-agent consensus

**Next Tutorials:**

1. [Deploy to Kubernetes](./kubernetes-deployment.md)
2. [Telegram Bot Integration](./telegram-integration.md)

**Resources:**

- 📚 [Multi-Agent Systems Guide](../guides/multi-agent-systems.md)
- 🛠️ [Consensus API Reference](../api/runtime-api.md#consensus)
- 💬 Discord: [discord.gg/agentik-os](https://discord.gg/agentik-os)

---

*Last updated: February 14, 2026*
*Agentik OS Tutorial Team*
