# Testing Strategy - Phase 4

**Owner:** testing-lead
**Target:** >80% test coverage across ALL features
**Timeline:** Steps 201-230

---

## Current State (Baseline)

### Test Metrics
- **Total Test Files:** 61
- **Total Tests:** 1,154 passing
- **Skipped Tests:** 1
- **Coverage:** TBD (need to run coverage report)

### Package Breakdown
| Package | Test Files | Tests | Status |
|---------|-----------|-------|--------|
| Runtime | 49 | 832 | ✅ |
| CLI | 9 | 122 | ✅ |
| Google Calendar Skill | 2 | 60 | ✅ |
| File Ops Skill | 1 | 140 | ✅ |
| **TOTAL** | **61** | **1,154** | ✅ |

---

## Testing Pyramid

### Unit Tests (60% of tests)
**Target:** Every function, class, utility tested in isolation

**Priority Areas:**
- [ ] All skills (20 skills × 15 tests avg = 300 tests)
- [ ] All modes (Focus, Creative, Research) - 10 tests each
- [ ] Core runtime utilities
- [ ] Model router logic
- [ ] Cost calculation engine
- [ ] Permission system
- [ ] WASM sandbox

### Integration Tests (30% of tests)
**Target:** Component interactions, API integrations

**Priority Areas:**
- [ ] Skill + Agent workflows
- [ ] Mode switching behavior
- [ ] Multi-agent coordination
- [ ] Channel adapters (CLI, API, Telegram, Discord, Webhook, MCP)
- [ ] External API integrations (Anthropic, OpenAI, Google, Stripe)
- [ ] Convex backend operations

### E2E Tests (10% of tests)
**Target:** Complete user journeys

**Priority Areas:**
- [ ] Complete dashboard flows
- [ ] CLI complete workflows
- [ ] Marketplace skill installation
- [ ] Agent creation → execution → monitoring
- [ ] Cost tracking end-to-end
- [ ] Multi-user scenarios

---

## Performance Tests

**Load Testing:**
- [ ] 100 concurrent agents
- [ ] 1,000 messages/minute
- [ ] Marketplace with 1,000 skills

**Stress Testing:**
- [ ] Memory leak detection (24h continuous run)
- [ ] Database connection pooling
- [ ] API rate limit handling

**Benchmarks:**
- [ ] Response time < 200ms (p95)
- [ ] Agent startup < 1s
- [ ] Dashboard page load < 2s

---

## Security Tests

**WASM Sandbox:**
- [ ] Sandbox escape attempts (50+ payloads)
- [ ] File system access restrictions
- [ ] Network access restrictions
- [ ] Memory limits

**Injection Attacks:**
- [ ] XSS payloads (25+ variations)
- [ ] SQL injection (10+ variations)
- [ ] Command injection (15+ variations)
- [ ] Template injection (10+ variations)

**Permission Bypasses:**
- [ ] Unauthorized skill execution
- [ ] Privilege escalation
- [ ] Token theft attempts

**Secret Detection:**
- [ ] TruffleHog scans (Step 201)
- [ ] Hardcoded credentials
- [ ] API keys in logs

---

## Test Organization

```
tests/
├── unit/              # Fast, isolated tests
│   ├── runtime/
│   ├── cli/
│   ├── skills/
│   └── dashboard/
├── integration/       # Component interaction tests
│   ├── channels/
│   ├── skills/
│   └── backend/
├── e2e/              # Full user journeys (Playwright)
│   ├── dashboard/
│   ├── cli/
│   └── marketplace/
├── performance/      # Load, stress, benchmarks
├── security/         # Penetration tests
└── fixtures/         # Test data
```

---

## Coverage Goals

### By Package
| Package | Current | Target | Gap |
|---------|---------|--------|-----|
| Runtime | TBD | >85% | TBD |
| Dashboard | TBD | >80% | TBD |
| CLI | TBD | >85% | TBD |
| SDK | TBD | >80% | TBD |
| Skills | TBD | >80% | TBD |

### By Type
| Type | Lines | Functions | Branches |
|------|-------|-----------|----------|
| Unit | >80% | >85% | >75% |
| Integration | >70% | >75% | >65% |
| E2E | >60% | N/A | N/A |

---

## Quality Metrics

### Required
- ✅ All tests pass
- ✅ 0 skipped tests (except known issues)
- ✅ 0 flaky tests
- ✅ < 30s test suite run time (unit only)
- ✅ < 5min full test suite

### Monitoring
- Test execution time trends
- Flakiness detection
- Coverage trends
- Failed test alerts

---

## CI/CD Integration

### Pre-commit
- Lint
- Type check
- Fast unit tests (<10s)

### Pull Request
- Full unit test suite
- Integration tests
- Type coverage check
- Security scans

### Main Branch
- Full test suite
- E2E tests
- Performance benchmarks
- Coverage report upload

---

## Test Implementation Plan

### Week 1: Foundation
- [ ] Run coverage report (baseline)
- [ ] Identify gaps
- [ ] Create test templates
- [ ] Set up CI/CD hooks

### Week 2: Unit Tests
- [ ] Skill testing (priority)
- [ ] Mode testing
- [ ] Runtime core

### Week 3: Integration Tests
- [ ] Channel adapters
- [ ] Multi-agent coordination
- [ ] External APIs

### Week 4: E2E & Performance
- [ ] Dashboard E2E (Playwright)
- [ ] CLI E2E
- [ ] Load testing
- [ ] Security scans

---

## Next Steps

1. **Generate coverage report**
   ```bash
   pnpm test -- --coverage
   ```

2. **Identify critical gaps**
   - Features with <50% coverage
   - High-risk features (security, payments)

3. **Create task breakdown**
   - One task per skill (20 skills)
   - One task per mode (3 modes)
   - Integration test tasks
   - E2E test tasks

4. **Begin implementation**
   - Start with highest risk areas
   - Aim for >80% coverage target

---

**Status:** Planning
**Next Update:** After coverage report generated
**Questions for team-lead:** See initial message
