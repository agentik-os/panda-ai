# AOCD - Agentik OS Certified Developer

## Overview

The AOCD certification validates proficiency in building, deploying, and maintaining AI agents on the Agentik OS platform. This 20-hour program covers architecture, skill development, best practices, and production deployment.

## Prerequisites

- Intermediate TypeScript/JavaScript experience
- Basic understanding of AI/LLM concepts
- Familiarity with REST APIs and async programming

## Curriculum Structure

| Module | Title | Duration | Focus |
|--------|-------|----------|-------|
| 1 | Architecture & Core Concepts | 5 hours | Platform internals, runtime, pipelines |
| 2 | Skill Development | 6 hours | Building skills, SDK, testing, publishing |
| 3 | Best Practices & Production | 5 hours | Security, performance, monitoring |
| 4 | Hands-On Capstone | 4 hours | Build and deploy a complete agent |

**Total Duration:** 20 hours
**Exam Duration:** 90 minutes
**Passing Score:** 75%

## Module Details

### Module 1: Architecture & Core Concepts (5 hours)

**Topics:**
- Agentik OS architecture overview
- Monorepo structure (Turborepo + pnpm)
- Runtime engine: message pipeline, middleware, context
- Agent lifecycle: create, configure, execute, monitor
- Multi-model router: Claude, GPT, Gemini, Ollama
- Channel adapters: CLI, API, Telegram, Discord, WebSocket
- Convex backend: schema design, real-time queries, mutations
- Event sourcing and cost tracking

**Hands-On Labs:**
- Lab 1.1: Set up local development environment
- Lab 1.2: Trace a message through the pipeline
- Lab 1.3: Configure a multi-model agent

**Assessment:** Quiz (20 questions)

### Module 2: Skill Development (6 hours)

**Topics:**
- SkillBase class and SDK types
- Permission system (9 categories)
- Skill manifest (skill.json) specification
- Input validation and error handling
- Testing framework: mocks, assertions, test runner
- Hot-reload development with `panda dev`
- Publishing to the marketplace
- Version management and dependencies

**Hands-On Labs:**
- Lab 2.1: Create a skill from template (`panda skill create`)
- Lab 2.2: Implement a weather lookup skill
- Lab 2.3: Write comprehensive tests
- Lab 2.4: Publish to the marketplace

**Assessment:** Skill submission (graded by automated tests)

### Module 3: Best Practices & Production (5 hours)

**Topics:**
- Security: WASM sandboxing, permission enforcement, input sanitization
- Authentication: SSO, OAuth, RBAC, API keys
- Performance: caching, connection pooling, batch processing
- Monitoring: Prometheus metrics, Sentry error tracking
- Cost management: budget alerts, per-model tracking, optimization
- Deployment: Docker, Kubernetes, multi-tenancy
- OS modes: Focus, Creative, Research, Custom
- Multi-AI consensus: quorum, deliberation, debate

**Hands-On Labs:**
- Lab 3.1: Configure RBAC and audit logging
- Lab 3.2: Set up Prometheus monitoring dashboard
- Lab 3.3: Deploy with Docker Compose
- Lab 3.4: Implement budget alerts and cost controls

**Assessment:** Architecture review (code submission)

### Module 4: Hands-On Capstone (4 hours)

**Project: Build a Complete AI Agent**

Requirements:
1. Create an agent with at least 3 custom skills
2. Implement proper error handling and logging
3. Add monitoring and cost tracking
4. Write tests (>80% coverage)
5. Deploy to a production-like environment
6. Document the agent's capabilities

**Deliverables:**
- Working agent codebase
- skill.json manifests for each skill
- Test suite with >80% coverage
- Deployment configuration (Docker or K8s)
- README documentation

**Assessment:** Capstone review (manual grading)

## Exam Format

| Section | Questions | Weight | Format |
|---------|-----------|--------|--------|
| Architecture | 15 | 25% | Multiple choice |
| Skill Development | 20 | 30% | Multiple choice + code completion |
| Best Practices | 15 | 25% | Multiple choice + scenario |
| Capstone | 1 | 20% | Project submission |

**Duration:** 90 minutes (written) + capstone project
**Passing Score:** 75%
**Validity:** 2 years (renewable with continuing education)

## Badge

Upon passing, candidates receive:
- Digital badge (verifiable on-chain)
- Certificate PDF
- Profile badge on Agentik OS marketplace
- Access to AOCD alumni community

## Renewal

- Complete 10 hours of continuing education every 2 years
- Or pass the updated exam
- AOCD holders get early access to new platform features
