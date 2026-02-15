# End-to-End Tests

This directory contains end-to-end tests that verify complete user flows through the Agentik OS system.

## Phase 0 E2E Test

**File:** `phase-0.test.ts`
**Purpose:** Verify complete CLI flow from agent creation → conversation → response → memory persistence

### Current Status

✅ **Framework Ready** - Tests pass with mocked implementation
⏸️ **Awaiting Real CLI** - Tests use mocks until Step-033 (CLI chat command) is fully integrated

### Test Coverage

The Phase 0 E2E test verifies:

1. **Agent Creation** - `panda agent create` command
2. **Chat Interaction** - `panda chat` command
3. **AI Response** - Proper model routing and response formatting
4. **Memory Persistence** - Conversation turns saved correctly
5. **Multi-turn Conversations** - Context/memory across messages
6. **Model Selection** - Complexity-based routing (Haiku vs Sonnet vs Opus)
7. **Cost Tracking** - Accurate token usage and cost calculation
8. **Error Handling** - Invalid agent ID, empty messages

### Running Tests

```bash
# Run E2E tests
npx vitest run tests/e2e/

# Run with watch mode
npx vitest tests/e2e/

# Run specific test file
npx vitest run tests/e2e/phase-0.test.ts
```

## Updating to Real CLI

Once Step-033 (CLI chat command) is fully implemented, update the tests:

### 1. Replace Mocked Agent Creation

**Current (mocked):**
```typescript
const agentConfig = {
  id: testAgentId,
  name: "Test Agent",
  model: "claude-sonnet-4-5-20250929",
  systemPrompt: "You are a helpful AI assistant for testing.",
  userId: testUserId,
  createdAt: new Date().toISOString(),
};
```

**Update to (real CLI):**
```typescript
const createOutput = await execAsync(
  `node ${CLI_PATH} agent create --id ${testAgentId} --name "Test Agent"`
);
const agentConfig = JSON.parse(createOutput.stdout);
```

### 2. Replace Mocked Chat

**Current (mocked):**
```typescript
const mockChatResponse = {
  agentId: testAgentId,
  userId: testUserId,
  userMessage: "Hello, can you help me test the system?",
  aiResponse: "Hello! Yes, I can help you...",
  // ... mock data
};
```

**Update to (real CLI):**
```typescript
const chatOutput = await execAsync(
  `node ${CLI_PATH} chat --agent ${testAgentId} --message "Hello, can you help me test the system?"`
);
const chatResponse = JSON.parse(chatOutput.stdout);
```

### 3. Add Real Memory Verification

Once Convex backend is integrated:

```typescript
// Verify memory was actually saved
const memoryOutput = await execAsync(
  `node ${CLI_PATH} agent memory --agent ${testAgentId}`
);
const savedMemory = JSON.parse(memoryOutput.stdout);

expect(savedMemory.turns).toHaveLength(1);
expect(savedMemory.turns[0].userMessage.content).toBe("Hello, can you help me test the system?");
```

## Test Structure

```
tests/e2e/
├── README.md           # This file
├── phase-0.test.ts     # Phase 0 complete flow test
├── .test-data/         # Temporary test data (auto-cleanup)
└── helpers/            # (future) Shared test utilities
```

## Dependencies

- **Step-033** (CLI chat command) - Required for real CLI execution
- **Step-036** (Integration tests) - Validates individual pipeline stages
- **Convex backend** - Required for real memory persistence verification

## Test Data Cleanup

Tests automatically create and cleanup test data in `.test-data/` directory:
- Created: `beforeAll()` hook
- Cleaned: `afterAll()` hook

## Timeout

E2E tests have extended timeout (30 seconds) to account for:
- CLI command execution
- AI model API calls
- Memory persistence operations

## Next Steps

1. ✅ Framework prepared with mocked tests
2. ⏸️ Update with real CLI commands once step-033 integrated
3. ⏸️ Add real memory verification once Convex integrated
4. ⏸️ Add more E2E scenarios (error cases, edge cases)
5. ⏸️ Add performance benchmarks

---

**Last Updated:** 2026-02-14
**Status:** Framework ready, awaiting CLI integration
