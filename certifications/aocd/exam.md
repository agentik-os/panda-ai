# AOCD Certification Exam

## Exam Details

- **Duration:** 90 minutes
- **Total Questions:** 50
- **Passing Score:** 75% (38/50)
- **Format:** Multiple choice, code completion, scenario-based

---

## Section 1: Architecture & Core Concepts (15 questions, 25%)

### Q1. What is the primary role of the Runtime Engine?
- A) Serve the web dashboard
- B) Process messages through the middleware pipeline ✓
- C) Store data in the database
- D) Manage user authentication

### Q2. Which package contains the SkillBase class?
- A) @agentik-os/runtime
- B) @agentik-os/cli
- C) @agentik-os/sdk ✓
- D) @agentik-os/shared

### Q3. What database does Agentik OS use for real-time data?
- A) PostgreSQL
- B) MongoDB
- C) Convex ✓
- D) SQLite

### Q4. In the message pipeline, what happens after authentication?
- A) Model routing
- B) Rate limiting ✓
- C) Skill execution
- D) Response formatting

### Q5. Which tool manages the Agentik OS monorepo?
- A) Lerna
- B) Nx
- C) Turborepo ✓
- D) Rush

### Q6. What is the CLI tool called?
- A) agentik
- B) panda ✓
- C) agent
- D) aos

### Q7. Which model routing strategy queries multiple models?
- A) Direct
- B) Fallback
- C) Cost-Optimized
- D) Consensus ✓

### Q8. What framework is the dashboard built with?
- A) React + Vite
- B) Next.js 16 ✓
- C) Remix
- D) SvelteKit

### Q9. Channel adapters translate between:
- A) Models and responses
- B) External protocols and internal message format ✓
- C) Skills and permissions
- D) Users and agents

### Q10. Which is NOT a supported AI provider?
- A) Anthropic (Claude)
- B) OpenAI (GPT)
- C) Cohere (Command) ✓
- D) Google (Gemini)

### Q11. What package contains shared TypeScript types?
- A) @agentik-os/types
- B) @agentik-os/shared ✓
- C) @agentik-os/common
- D) @agentik-os/core

### Q12. How are agent events stored for debugging?
- A) Log files only
- B) Event sourcing ✓
- C) In-memory cache
- D) External service

### Q13. What is the Time Travel Debug feature for?
- A) Version control
- B) Replaying conversations with different parameters ✓
- C) Scheduling future tasks
- D) Backup and restore

### Q14. WebSocket connections are used for:
- A) Skill installation
- B) Real-time updates ✓
- C) Database queries
- D) Authentication

### Q15. The Agent Dreams feature is for:
- A) Generating creative content
- B) Autonomous nightly processing and memory consolidation ✓
- C) Sleep mode for agents
- D) Testing in isolation

---

## Section 2: Skill Development (20 questions, 30%)

### Q16. What class must all skills extend?
- A) BasePlugin
- B) SkillBase ✓
- C) AgentSkill
- D) SkillHandler

### Q17. Complete the code: Which property is NOT required on SkillBase?
```typescript
class MySkill extends SkillBase {
  readonly id = "my-skill";
  readonly name = "My Skill";
  readonly description = "Does something";
  readonly version = "1.0.0";
  // Which is optional?
}
```
- A) id
- B) name
- C) author ✓
- D) version

### Q18. What naming convention is required for skill IDs?
- A) camelCase
- B) PascalCase
- C) kebab-case ✓
- D) SCREAMING_CASE

### Q19. How many permission categories exist?
- A) 5
- B) 7
- C) 9 ✓
- D) 12

### Q20. Which command creates a new skill from template?
- A) `panda create skill`
- B) `panda skill create` ✓
- C) `panda new skill`
- D) `panda skill init`

### Q21. The skill.json file is called:
- A) Configuration file
- B) Manifest ✓
- C) Schema
- D) Definition

### Q22. What does `panda dev --test` do?
- A) Run tests once and exit
- B) Watch files and run tests on changes ✓
- C) Deploy a test version
- D) Create test fixtures

### Q23. Which function creates a mock context for testing?
- A) mockContext()
- B) createMockContext() ✓
- C) setupContext()
- D) testContext()

### Q24. The SkillTestRunner supports:
- A) Only pass/fail assertions
- B) Expected success, error message, and field matching ✓
- C) Only snapshot testing
- D) Visual regression testing

### Q25. What command publishes a skill to the marketplace?
- A) `panda release`
- B) `panda deploy`
- C) `panda publish` ✓
- D) `panda skill push`

### Q26-35. [Additional skill development questions...]

---

## Section 3: Best Practices & Production (15 questions, 25%)

### Q36. What technology sandboxes skill execution?
- A) Docker
- B) WASM (Extism) ✓
- C) VM
- D) chroot

### Q37. Default budget alert threshold is:
- A) 50%
- B) 70%
- C) 80% ✓
- D) 95%

### Q38. Which deployment method does `panda deploy` support?
- A) Docker and Kubernetes ✓
- B) AWS Lambda only
- C) Vercel only
- D) Heroku only

### Q39-50. [Additional best practices questions...]

---

## Scoring Guide

| Score | Result | Action |
|-------|--------|--------|
| 75-100% | PASS | Badge issued |
| 60-74% | NEAR PASS | Retake after 2 weeks |
| Below 60% | FAIL | Retake after completing review modules |

## Retake Policy

- Maximum 3 attempts per 6-month period
- 2-week waiting period between attempts
- Different question set on each attempt
