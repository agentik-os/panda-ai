# Task #129: Fix Runtime Critical Coverage Gaps

**Owner:** testing-lead
**Status:** Ready to implement (awaiting approval)
**Priority:** CRITICAL
**Target:** 0-25% → >80% coverage

---

## Files to Fix

### 1. automations/intent-classifier.ts (0% → >80%)

**Current Coverage:** 0%
**Target:** >80%
**Estimated Tests:** ~30

#### Test Structure

```
src/automations/intent-classifier.test.ts
├── IntentClassifier class
│   ├── classify() - Main method
│   │   ├── Schedule intents
│   │   │   ├── "Every day at 9am"
│   │   │   ├── "Daily at 6pm"
│   │   │   ├── "Weekly on Monday"
│   │   │   ├── "Every hour"
│   │   │   └── "Run at midnight"
│   │   ├── Event intents
│   │   │   ├── "When a new user signs up"
│   │   │   ├── "If order total > $100"
│   │   │   ├── "After payment succeeds"
│   │   │   └── "On file upload"
│   │   ├── Webhook intents
│   │   │   ├── "Listen for webhook at /api/github"
│   │   │   ├── "On POST to /webhook"
│   │   │   └── "Webhook listener /stripe"
│   │   ├── Notification intents
│   │   │   ├── "Send email notification"
│   │   │   ├── "Notify admin when..."
│   │   │   └── "Alert on error"
│   │   └── Unknown intents
│   │       ├── Empty string
│   │       ├── Gibberish
│   │       └── Ambiguous text
│   ├── isScheduleIntent()
│   │   ├── Returns true for schedule keywords
│   │   └── Returns false for non-schedule
│   ├── isEventIntent()
│   │   ├── Returns true for event keywords
│   │   └── Returns false for non-event
│   ├── isWebhookIntent()
│   │   ├── Returns true for webhook keywords
│   │   └── Returns false for non-webhook
│   ├── isNotificationIntent()
│   │   ├── Returns true for notification keywords
│   │   └── Returns false for non-notification
│   ├── classifySchedule()
│   │   ├── Extracts schedule/cron
│   │   ├── Sets high confidence
│   │   └── Returns entities
│   ├── classifyEvent()
│   │   ├── Extracts event name
│   │   ├── Sets confidence
│   │   └── Returns entities
│   ├── classifyWebhook()
│   │   ├── Extracts webhook path
│   │   ├── Sets confidence
│   │   └── Returns entities
│   └── classifyNotification()
│       ├── Extracts notification type
│       ├── Sets confidence
│       └── Returns entities
```

#### Test Cases

**Schedule Intent Tests (8 tests):**
1. "Every day at 9am" → schedule_task, cron extracted
2. "Daily report" → schedule_task, high confidence
3. "Weekly on Monday" → schedule_task, schedule extracted
4. "Run hourly" → schedule_task
5. "At midnight" → schedule_task
6. "Cron 0 9 * * *" → schedule_task, cron validated
7. Case insensitive: "EVERY DAY" → works
8. Whitespace handling: " every day  " → works

**Event Intent Tests (6 tests):**
1. "When user signs up" → event_trigger, event extracted
2. "If balance > 100" → condition_check
3. "After payment" → event_trigger
4. "On file upload" → event_trigger
5. "Trigger when X" → event_trigger
6. Multiple conditions → complex event

**Webhook Intent Tests (4 tests):**
1. "Listen for webhook at /api/github" → webhook_listener, path extracted
2. "On POST /webhook" → webhook_listener
3. "Webhook /stripe" → webhook_listener, path = "/stripe"
4. Invalid path → lower confidence

**Notification Intent Tests (4 tests):**
1. "Send email" → notification
2. "Notify admin" → notification
3. "Alert on error" → notification + event
4. "Email daily report" → notification + schedule

**Unknown Intent Tests (4 tests):**
1. Empty string → unknown, confidence 0, suggestions
2. Random text "asdfghjkl" → unknown, suggestions
3. Ambiguous "do something" → unknown
4. null/undefined handling → error or unknown

**Edge Cases (4 tests):**
1. Multiple intents in one text
2. Very long text (>1000 chars)
3. Special characters
4. Unicode/emoji

---

### 2. websocket/server.ts (25% → >80%)

**Current Coverage:** 25.64%
**Target:** >80%
**Estimated Tests:** ~40

#### Test Structure

```
src/websocket/server.test.ts
├── AgentikWebSocketServer class
│   ├── constructor()
│   │   ├── Default config
│   │   ├── Custom config
│   │   └── Partial config merge
│   ├── start()
│   │   ├── Starts server successfully
│   │   ├── Warns if already running
│   │   ├── Starts heartbeat
│   │   └── Emits ready event
│   ├── stop()
│   │   ├── Stops server gracefully
│   │   ├── Closes all connections
│   │   ├── Clears heartbeat
│   │   └── Cleans up resources
│   ├── handleConnection()
│   │   ├── Accepts new connection
│   │   ├── Generates client ID
│   │   ├── Sends connection established
│   │   └── Sets up message handlers
│   ├── handleMessage()
│   │   ├── Parse valid JSON
│   │   ├── Reject invalid JSON
│   │   ├── Handle subscribe message
│   │   ├── Handle unsubscribe message
│   │   ├── Handle ping message
│   │   └── Unknown message type
│   ├── handleSubscribe()
│   │   ├── Subscribe to channel
│   │   ├── Send confirmation
│   │   ├── Track in subscribers map
│   │   └── Handle already subscribed
│   ├── handleUnsubscribe()
│   │   ├── Unsubscribe from channel
│   │   ├── Send confirmation
│   │   ├── Remove from subscribers
│   │   └── Handle not subscribed
│   ├── broadcast()
│   │   ├── Send to all clients
│   │   ├── Send to channel subscribers
│   │   ├── Filter by userId
│   │   └── Handle errors
│   ├── send()
│   │   ├── Send to specific client
│   │   ├── Handle client not found
│   │   └── Handle send errors
│   ├── startHeartbeat()
│   │   ├── Pings all clients
│   │   ├── Detects dead connections
│   │   ├── Closes dead connections
│   │   └── Runs on interval
│   ├── handleDisconnect()
│   │   ├── Removes client
│   │   ├── Unsubscribes from channels
│   │   └── Cleans up resources
│   └── getStats()
│       ├── Returns client count
│       ├── Returns channel counts
│       └── Returns metrics
```

#### Test Cases

**Server Lifecycle (6 tests):**
1. Constructor with default config
2. Constructor with custom config
3. Start server successfully
4. Start when already running (warn)
5. Stop server gracefully
6. Stop when not running (no-op)

**Connection Handling (8 tests):**
1. Accept new connection
2. Assign unique client ID
3. Send connection established message
4. Handle multiple simultaneous connections
5. Handle connection with userId
6. Handle malformed connection
7. Connection timeout
8. Max connections limit

**Message Handling (10 tests):**
1. Parse valid JSON message
2. Reject invalid JSON
3. Handle subscribe message
4. Handle unsubscribe message
5. Handle ping message
6. Handle unknown message type
7. Large message handling
8. Empty message handling
9. Message rate limiting
10. Concurrent messages

**Channel Subscriptions (8 tests):**
1. Subscribe to channel
2. Unsubscribe from channel
3. Subscribe to multiple channels
4. Unsubscribe from all
5. Subscribe when already subscribed
6. Unsubscribe when not subscribed
7. Invalid channel name
8. Channel permissions

**Broadcasting (6 tests):**
1. Broadcast to all clients
2. Broadcast to channel subscribers only
3. Broadcast with userId filter
4. Empty subscriber list
5. Failed send handling
6. Large broadcast

**Heartbeat (4 tests):**
1. Heartbeat pings all clients
2. Detect dead connections
3. Close dead connections
4. Heartbeat interval timing

**Error Handling (4 tests):**
1. Server error event
2. Client connection error
3. Send error handling
4. Graceful shutdown on error

---

### 3. convex-client.ts (14% → >80%)

**Current Coverage:** 14.28%
**Target:** >80%
**Estimated Tests:** ~20

#### Test Structure

```
src/convex-client.test.ts
├── ConvexClient initialization
│   ├── Initialize with valid URL
│   ├── Initialize with auth
│   └── Handle invalid URL
├── Query operations
│   ├── Execute query
│   ├── Subscribe to query
│   ├── Unsubscribe
│   └── Handle query errors
├── Mutation operations
│   ├── Execute mutation
│   ├── Handle mutation errors
│   └── Optimistic updates
└── Connection management
    ├── Connect
    ├── Disconnect
    ├── Reconnect
    └── Handle connection errors
```

#### Test Cases (20 tests)

1. Initialize client with deployment URL
2. Initialize with auth token
3. Initialize with invalid URL → error
4. Execute query successfully
5. Query returns expected data
6. Query with arguments
7. Subscribe to query updates
8. Receive real-time updates
9. Unsubscribe from query
10. Execute mutation successfully
11. Mutation with arguments
12. Mutation error handling
13. Optimistic update
14. Connect to Convex
15. Disconnect gracefully
16. Reconnect after disconnect
17. Connection timeout
18. Network error handling
19. Rate limiting
20. Concurrent operations

---

## Implementation Plan

### Day 1: intent-classifier.ts
- [ ] Create test file structure
- [ ] Implement schedule intent tests (8)
- [ ] Implement event intent tests (6)
- [ ] Run coverage → should be ~40%

### Day 2: intent-classifier.ts (continued)
- [ ] Implement webhook tests (4)
- [ ] Implement notification tests (4)
- [ ] Implement unknown/edge cases (8)
- [ ] Run coverage → should be >80%

### Day 3: websocket/server.ts
- [ ] Create test file structure
- [ ] Implement lifecycle tests (6)
- [ ] Implement connection tests (8)
- [ ] Run coverage → should be ~40%

### Day 4: websocket/server.ts (continued)
- [ ] Implement message handling tests (10)
- [ ] Implement subscription tests (8)
- [ ] Run coverage → should be ~70%

### Day 5: websocket/server.ts + convex-client.ts
- [ ] Complete websocket tests (broadcast, heartbeat, errors)
- [ ] Run coverage → websocket >80%
- [ ] Start convex-client tests
- [ ] Run coverage → convex ~50%

### Day 6: convex-client.ts
- [ ] Complete all convex tests (20)
- [ ] Run final coverage report
- [ ] All 3 files >80% ✅

---

## Acceptance Criteria

- ✅ intent-classifier.ts: >80% coverage (currently 0%)
- ✅ websocket/server.ts: >80% coverage (currently 25%)
- ✅ convex-client.ts: >80% coverage (currently 14%)
- ✅ All tests passing
- ✅ 0 flaky tests
- ✅ Tests run in <5s total
- ✅ Runtime package coverage: 71% → >75%

---

**Status:** Ready to implement
**Estimated Effort:** 6 days (48 hours)
**Blocking:** Awaiting team-lead approval
