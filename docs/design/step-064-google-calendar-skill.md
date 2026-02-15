# Step-064: Google Calendar Skill - Design Document

**Status:** Design Phase
**Owner:** channels-integrations-3
**Created:** 2026-02-14
**Dependencies:** Step-061 ✅, Step-062 ✅

---

## Overview

Design for the third built-in skill: Google Calendar integration. Provides comprehensive calendar management through Google Calendar API v3 with OAuth2 authentication.

## Dependencies

- ✅ Step-060: WASM Sandbox with Extism (complete)
- ✅ Step-061: Permission System for Skills (complete)
- ✅ Step-062: Web Search Skill (complete - reference pattern)

---

## User Stories

### US-1: List Calendars
```typescript
// Agent wants to see all available calendars
const calendars = await skill.listCalendars();
// Returns: [
//   { id: 'primary', summary: 'Work Calendar', ... },
//   { id: 'abc123', summary: 'Personal', ... }
// ]
```

### US-2: Create Event
```typescript
// Agent schedules a meeting
const event = await skill.createEvent({
  calendarId: 'primary',
  summary: 'Team Standup',
  description: 'Daily standup meeting',
  start: { dateTime: '2026-02-15T10:00:00-08:00' },
  end: { dateTime: '2026-02-15T10:30:00-08:00' },
  attendees: ['alice@example.com', 'bob@example.com'],
  reminders: { useDefault: false, overrides: [{ method: 'email', minutes: 30 }] }
});
```

### US-3: Search Events
```typescript
// Find all meetings with "standup" in the title
const events = await skill.searchEvents({
  calendarId: 'primary',
  query: 'standup',
  timeMin: '2026-02-01T00:00:00Z',
  timeMax: '2026-02-28T23:59:59Z',
  maxResults: 25
});
```

### US-4: Update Event
```typescript
// Reschedule a meeting
const updated = await skill.updateEvent({
  calendarId: 'primary',
  eventId: 'evt_123',
  updates: {
    start: { dateTime: '2026-02-15T14:00:00-08:00' },
    end: { dateTime: '2026-02-15T14:30:00-08:00' }
  }
});
```

### US-5: Delete Event
```typescript
// Cancel a meeting
await skill.deleteEvent({
  calendarId: 'primary',
  eventId: 'evt_123',
  sendNotifications: true
});
```

### US-6: Get Free/Busy Information
```typescript
// Check availability for scheduling
const freeBusy = await skill.getFreeBusy({
  calendars: ['primary', 'work@example.com'],
  timeMin: '2026-02-15T08:00:00-08:00',
  timeMax: '2026-02-15T18:00:00-08:00'
});
```

---

## API Surface

### Core Functions

```typescript
export interface GoogleCalendarSkill {
  // Calendar Management
  listCalendars(options?: ListCalendarsOptions): Promise<Calendar[]>;
  getCalendar(calendarId: string): Promise<Calendar>;

  // Event CRUD
  createEvent(params: CreateEventParams): Promise<CalendarEvent>;
  getEvent(calendarId: string, eventId: string): Promise<CalendarEvent>;
  updateEvent(params: UpdateEventParams): Promise<CalendarEvent>;
  deleteEvent(params: DeleteEventParams): Promise<void>;

  // Event Search & Listing
  listEvents(params: ListEventsParams): Promise<CalendarEvent[]>;
  searchEvents(params: SearchEventsParams): Promise<CalendarEvent[]>;

  // Availability
  getFreeBusy(params: FreeBusyParams): Promise<FreeBusyResponse>;

  // Recurring Events
  createRecurringEvent(params: CreateRecurringEventParams): Promise<CalendarEvent>;
  updateRecurringInstance(params: UpdateRecurringInstanceParams): Promise<CalendarEvent>;

  // Utility
  quickAdd(calendarId: string, text: string): Promise<CalendarEvent>;
  move(params: MoveEventParams): Promise<CalendarEvent>;
}
```

### Type Definitions

```typescript
export interface Calendar {
  id: string;
  summary: string;
  description?: string;
  timeZone: string;
  accessRole: 'owner' | 'writer' | 'reader' | 'freeBusyReader';
  primary?: boolean;
  backgroundColor?: string;
}

export interface CalendarEvent {
  id: string;
  calendarId: string;
  summary: string;
  description?: string;
  location?: string;
  start: EventDateTime;
  end: EventDateTime;
  recurrence?: string[]; // RRULE strings
  attendees?: Attendee[];
  organizer?: Organizer;
  status: 'confirmed' | 'tentative' | 'cancelled';
  created: string; // ISO 8601
  updated: string;
  htmlLink: string;
  reminders?: Reminders;
  conferenceData?: ConferenceData;
}

export interface EventDateTime {
  dateTime?: string; // ISO 8601 with timezone
  date?: string;     // YYYY-MM-DD for all-day events
  timeZone?: string;
}

export interface Attendee {
  email: string;
  displayName?: string;
  responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  optional?: boolean;
  organizer?: boolean;
}

export interface Reminders {
  useDefault: boolean;
  overrides?: ReminderOverride[];
}

export interface ReminderOverride {
  method: 'email' | 'popup';
  minutes: number;
}

export interface ConferenceData {
  createRequest?: {
    requestId: string;
    conferenceSolutionKey: { type: 'hangoutsMeet' | 'eventHangout' };
  };
  conferenceId?: string;
  conferenceSolution?: {
    name: string;
    iconUri: string;
  };
  entryPoints?: ConferenceEntryPoint[];
}

export interface ConferenceEntryPoint {
  entryPointType: 'video' | 'phone' | 'sip' | 'more';
  uri: string;
  label?: string;
}
```

---

## OAuth2 Authentication Flow

### 1. Initial Setup

```typescript
export interface GoogleCalendarConfig {
  clientId: string;          // OAuth2 client ID
  clientSecret: string;      // OAuth2 client secret
  redirectUri: string;       // OAuth2 redirect URI
  scopes: string[];          // Calendar API scopes
  tokenStorePath?: string;   // Where to store tokens (default: ~/.agentik-os/data/credentials/)
}

// Default scopes
const DEFAULT_SCOPES = [
  'https://www.googleapis.com/auth/calendar',           // Full access
  'https://www.googleapis.com/auth/calendar.readonly',  // Read-only
  'https://www.googleapis.com/auth/calendar.events'     // Events only
];
```

### 2. Authorization Flow

```
User → Skill requests auth
      ↓
Skill → Generate auth URL
      ↓
User → Opens URL in browser
      ↓
Google → User grants permission
      ↓
Google → Redirects to callback with code
      ↓
Skill → Exchanges code for tokens
      ↓
Skill → Stores tokens securely
      ↓
Skill → Returns success
```

### 3. Token Management

```typescript
interface TokenStorage {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
  token_type: 'Bearer';
  scope: string;
}

class TokenManager {
  async getAccessToken(): Promise<string> {
    const token = await this.loadToken();

    if (this.isTokenExpired(token)) {
      return await this.refreshAccessToken(token.refresh_token);
    }

    return token.access_token;
  }

  async refreshAccessToken(refreshToken: string): Promise<string> {
    // POST to https://oauth2.googleapis.com/token
    // with refresh_token grant
  }

  private isTokenExpired(token: TokenStorage): boolean {
    return Date.now() >= token.expiry_date - (5 * 60 * 1000); // 5 min buffer
  }
}
```

### 4. Credential Storage

**Location:** `~/.agentik-os/data/credentials/google-calendar.json`

**Format:**
```json
{
  "type": "authorized_user",
  "client_id": "xxx.apps.googleusercontent.com",
  "client_secret": "GOCSPX-xxx",
  "refresh_token": "1//xxx",
  "access_token": "ya29.xxx",
  "expiry_date": 1707868800000
}
```

**Security:**
- File permissions: `0600` (owner read/write only)
- Encrypted at rest (optional, Phase 2)
- Never logged or exposed in error messages

---

## Permission Integration (Step-061)

### skill.json Permissions

```json
{
  "permissions": [
    "network:https:www.googleapis.com",
    "network:https:oauth2.googleapis.com",
    "api:google:calendar",
    "fs:read:~/.agentik-os/data/credentials/google-calendar.json",
    "fs:write:~/.agentik-os/data/credentials/google-calendar.json",
    "kv:read:google_calendar:*",
    "kv:write:google_calendar:*"
  ]
}
```

### Permission Checks

```typescript
class GoogleCalendarSkill {
  private async checkPermission(operation: string): Promise<void> {
    const permissions = {
      listCalendars: 'api:google:calendar',
      createEvent: 'api:google:calendar',
      deleteEvent: 'api:google:calendar',
      readCredentials: 'fs:read:~/.agentik-os/data/credentials/google-calendar.json',
      writeCredentials: 'fs:write:~/.agentik-os/data/credentials/google-calendar.json'
    };

    const checker = new SkillPermissionChecker(this.config.permissions);
    const result = checker.check(permissions[operation]);

    if (!result.granted) {
      throw new PermissionDeniedError(
        `Operation '${operation}' requires permission: ${permissions[operation]}`
      );
    }
  }
}
```

---

## Error Handling

### Error Types

```typescript
export class GoogleCalendarError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'GoogleCalendarError';
  }
}

export class AuthenticationError extends GoogleCalendarError {
  constructor(message: string) {
    super(message, 'AUTHENTICATION_ERROR', 401);
  }
}

export class PermissionDeniedError extends GoogleCalendarError {
  constructor(message: string) {
    super(message, 'PERMISSION_DENIED', 403);
  }
}

export class NotFoundError extends GoogleCalendarError {
  constructor(message: string) {
    super(message, 'NOT_FOUND', 404);
  }
}

export class RateLimitError extends GoogleCalendarError {
  constructor(message: string, public retryAfter?: number) {
    super(message, 'RATE_LIMIT', 429);
  }
}

export class InvalidRequestError extends GoogleCalendarError {
  constructor(message: string, public validationErrors?: string[]) {
    super(message, 'INVALID_REQUEST', 400);
  }
}
```

### Error Scenarios

| Scenario | Error Type | Handling |
|----------|-----------|----------|
| No credentials | `AuthenticationError` | Prompt for OAuth2 setup |
| Expired token | `AuthenticationError` | Auto-refresh token |
| Invalid calendar ID | `NotFoundError` | Return clear error message |
| API quota exceeded | `RateLimitError` | Implement exponential backoff |
| Invalid event data | `InvalidRequestError` | Validate before API call |
| Network timeout | `GoogleCalendarError` | Retry with backoff |
| Permission denied | `PermissionDeniedError` | Check skill permissions |

### Retry Logic

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof RateLimitError) {
        const delay = error.retryAfter || (2 ** attempt * 1000);
        await sleep(delay);
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}
```

---

## Rate Limiting

### Google Calendar API Quotas

| Quota | Limit | Window |
|-------|-------|--------|
| Queries per day | 1,000,000 | Daily |
| Queries per 100 seconds per user | 1,000 | Per user |
| Queries per 100 seconds | 10,000 | Global |

### Skill-Level Rate Limiting

```typescript
class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  async checkLimit(userId: string): Promise<boolean> {
    const now = Date.now();
    const window = 100 * 1000; // 100 seconds
    const maxRequests = 1000;

    const userRequests = this.requests.get(userId) || [];
    const recentRequests = userRequests.filter(time => now - time < window);

    if (recentRequests.length >= maxRequests) {
      return false;
    }

    recentRequests.push(now);
    this.requests.set(userId, recentRequests);
    return true;
  }
}
```

---

## Timezone Handling

### Strategy

```typescript
// 1. Store all times in UTC internally
// 2. Convert to calendar timezone for API calls
// 3. Parse returned times back to UTC

import { DateTime } from 'luxon';

function toCalendarTime(utcTime: string, calendarTz: string): EventDateTime {
  const dt = DateTime.fromISO(utcTime, { zone: 'utc' });
  return {
    dateTime: dt.setZone(calendarTz).toISO(),
    timeZone: calendarTz
  };
}

function fromCalendarTime(eventTime: EventDateTime): string {
  if (eventTime.dateTime) {
    return DateTime.fromISO(eventTime.dateTime).toUTC().toISO();
  }
  // All-day event
  return DateTime.fromISO(eventTime.date!, { zone: eventTime.timeZone }).toUTC().toISO();
}
```

### Timezone Utilities

```typescript
interface TimezoneUtils {
  // Get user's default timezone
  getDefaultTimezone(): string;

  // Convert between timezones
  convertTimezone(time: string, fromTz: string, toTz: string): string;

  // Validate timezone
  isValidTimezone(tz: string): boolean;

  // Get timezone offset
  getTimezoneOffset(tz: string, date: Date): number;
}
```

---

## Recurring Events

### RRULE Support

```typescript
export interface RecurrenceOptions {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  interval?: number;        // Every N days/weeks/months/years
  count?: number;           // Number of occurrences
  until?: string;           // End date (ISO 8601)
  byDay?: string[];        // ['MO', 'WE', 'FR']
  byMonthDay?: number[];   // [1, 15, -1]
  byMonth?: number[];      // [1, 12]
}

function buildRRule(options: RecurrenceOptions): string {
  let rrule = `FREQ=${options.frequency}`;

  if (options.interval) rrule += `;INTERVAL=${options.interval}`;
  if (options.count) rrule += `;COUNT=${options.count}`;
  if (options.until) rrule += `;UNTIL=${options.until}`;
  if (options.byDay) rrule += `;BYDAY=${options.byDay.join(',')}`;
  // ... more rules

  return `RRULE:${rrule}`;
}
```

### Example: Weekly Meeting

```typescript
const event = await skill.createRecurringEvent({
  calendarId: 'primary',
  summary: 'Weekly Standup',
  start: { dateTime: '2026-02-17T10:00:00-08:00' },
  end: { dateTime: '2026-02-17T10:30:00-08:00' },
  recurrence: {
    frequency: 'WEEKLY',
    byDay: ['MO', 'WE', 'FR'],
    count: 50 // 50 meetings
  }
});
```

---

## skill.json Structure

```json
{
  "id": "google-calendar",
  "name": "Google Calendar",
  "version": "1.0.0",
  "description": "Manage Google Calendar events with full CRUD operations and OAuth2 authentication",
  "author": "Agentik OS",
  "type": "builtin",
  "permissions": [
    "network:https:www.googleapis.com",
    "network:https:oauth2.googleapis.com",
    "api:google:calendar",
    "fs:read:~/.agentik-os/data/credentials/google-calendar.json",
    "fs:write:~/.agentik-os/data/credentials/google-calendar.json",
    "kv:read:google_calendar:*",
    "kv:write:google_calendar:*"
  ],
  "rateLimit": {
    "maxRequests": 1000,
    "windowMs": 100000
  },
  "config": {
    "scopes": [
      "https://www.googleapis.com/auth/calendar"
    ],
    "tokenStorePath": "~/.agentik-os/data/credentials/google-calendar.json",
    "timeout": 10000
  },
  "dependencies": {
    "googleapis": "^140.0.0",
    "luxon": "^3.4.0"
  },
  "oauth2": {
    "provider": "google",
    "authUri": "https://accounts.google.com/o/oauth2/v2/auth",
    "tokenUri": "https://oauth2.googleapis.com/token",
    "requiredScopes": [
      "https://www.googleapis.com/auth/calendar"
    ]
  }
}
```

---

## Test Plan

### Unit Tests (35 tests)

```typescript
describe('GoogleCalendarSkill', () => {
  describe('Calendar Management', () => {
    it('should list all calendars');
    it('should get calendar by ID');
    it('should handle calendar not found');
  });

  describe('Event CRUD', () => {
    it('should create event with all fields');
    it('should create all-day event');
    it('should create event with attendees');
    it('should get event by ID');
    it('should update event summary');
    it('should update event time');
    it('should delete event');
    it('should delete event with notifications');
  });

  describe('Event Search', () => {
    it('should list events in date range');
    it('should search events by query');
    it('should filter by updated time');
    it('should paginate results');
  });

  describe('Recurring Events', () => {
    it('should create daily recurring event');
    it('should create weekly recurring event');
    it('should create monthly recurring event');
    it('should update recurring event instance');
    it('should update all future instances');
  });

  describe('Free/Busy', () => {
    it('should get free/busy for one calendar');
    it('should get free/busy for multiple calendars');
  });

  describe('Authentication', () => {
    it('should generate auth URL');
    it('should exchange code for tokens');
    it('should refresh expired token');
    it('should handle refresh failure');
  });

  describe('Error Handling', () => {
    it('should throw on invalid calendar ID');
    it('should throw on invalid event data');
    it('should throw on authentication failure');
    it('should throw on rate limit');
    it('should retry on network error');
  });

  describe('Timezone Handling', () => {
    it('should convert UTC to calendar timezone');
    it('should parse calendar timezone to UTC');
    it('should handle all-day events');
  });

  describe('Permissions', () => {
    it('should check API permission');
    it('should check file read permission');
    it('should throw on missing permission');
  });
});
```

### Integration Tests (10 tests)

```typescript
describe('Google Calendar Integration', () => {
  // Use mock Google Calendar API server

  it('should complete full OAuth2 flow');
  it('should create, read, update, delete event lifecycle');
  it('should handle concurrent event creation');
  it('should handle rate limiting gracefully');
  it('should refresh token when expired');
  it('should handle network timeouts');
  it('should handle API quota exceeded');
  it('should handle calendar deletion during operation');
  it('should handle recurring event edge cases');
  it('should handle timezone conversions correctly');
});
```

### Mocked API Responses

```typescript
// Mock successful event creation
const mockCreateEventResponse = {
  id: 'evt_123',
  summary: 'Test Event',
  start: { dateTime: '2026-02-15T10:00:00-08:00' },
  end: { dateTime: '2026-02-15T11:00:00-08:00' },
  status: 'confirmed',
  created: '2026-02-14T12:00:00Z',
  updated: '2026-02-14T12:00:00Z',
  htmlLink: 'https://calendar.google.com/event?eid=xxx'
};

// Mock calendar list
const mockCalendarListResponse = {
  items: [
    { id: 'primary', summary: 'Work Calendar', timeZone: 'America/Los_Angeles' },
    { id: 'abc123', summary: 'Personal', timeZone: 'America/New_York' }
  ]
};

// Mock error responses
const mockNotFoundError = {
  error: {
    code: 404,
    message: 'Not Found',
    errors: [{ reason: 'notFound', message: 'Calendar not found' }]
  }
};
```

---

## README.md Outline

```markdown
# Google Calendar Skill

Manage Google Calendar events with full CRUD operations and OAuth2 authentication.

## Features
- Calendar listing and management
- Event CRUD (Create, Read, Update, Delete)
- Event search and filtering
- Recurring events support
- Free/busy queries
- Timezone handling
- OAuth2 authentication with auto-refresh

## Installation
[OAuth2 setup, API key setup]

## Usage
[Quick start examples]

## API Reference
[Complete function reference]

## Configuration
[OAuth2 credentials, scopes, token storage]

## Error Handling
[Common errors and solutions]

## Permissions
[Required permissions explanation]

## Troubleshooting
[Common issues and fixes]

## Examples
[Real-world use cases]
```

---

## Google API Setup Instructions

### 1. Create Google Cloud Project

```bash
1. Go to https://console.cloud.google.com/
2. Click "Create Project"
3. Enter project name: "Agentik OS Calendar"
4. Click "Create"
```

### 2. Enable Calendar API

```bash
1. In Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google Calendar API"
3. Click "Enable"
```

### 3. Create OAuth2 Credentials

```bash
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select "Desktop app" (for CLI) or "Web application" (for dashboard)
4. Name: "Agentik OS Calendar Client"
5. Add redirect URI: http://localhost:8080/oauth2callback
6. Click "Create"
7. Download client_secret.json
```

### 4. Configure Consent Screen

```bash
1. Go to "OAuth consent screen"
2. Select "External" (if personal) or "Internal" (if org)
3. App name: "Agentik OS"
4. User support email: your-email@example.com
5. Add scopes:
   - .../auth/calendar
   - .../auth/calendar.readonly
   - .../auth/calendar.events
6. Add test users (for testing phase)
7. Save
```

### 5. Environment Variables

```bash
export GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
export GOOGLE_CLIENT_SECRET="GOCSPX-xxx"
export GOOGLE_REDIRECT_URI="http://localhost:8080/oauth2callback"
```

---

## Dependencies

### Production

```json
{
  "googleapis": "^140.0.0",    // Official Google APIs client
  "luxon": "^3.4.0"            // Timezone handling
}
```

### Development

```json
{
  "@types/luxon": "^3.4.0"
}
```

---

## Implementation Checklist

- [ ] Create `skills/google-calendar/` directory
- [ ] Implement OAuth2 flow (`auth.ts`)
- [ ] Implement token management (`token-manager.ts`)
- [ ] Implement core API (`index.ts`)
- [ ] Implement timezone utilities (`timezone.ts`)
- [ ] Implement recurring event helpers (`recurrence.ts`)
- [ ] Create `skill.json` manifest
- [ ] Write comprehensive tests (45 tests)
- [ ] Write README.md documentation
- [ ] Add error handling for all scenarios
- [ ] Implement rate limiting
- [ ] Add permission checks
- [ ] Test OAuth2 flow end-to-end
- [ ] Test token refresh
- [ ] Test all CRUD operations
- [ ] Test recurring events
- [ ] Update PROGRESS.md

---

## Timeline

**Estimated Hours:** 24 hours

**Breakdown:**
- OAuth2 flow: 6 hours
- Token management: 2 hours
- Core API implementation: 8 hours
- Timezone handling: 3 hours
- Tests: 4 hours
- Documentation: 1 hour

---

## Open Questions

1. **Multi-account support:** Should we support multiple Google accounts per agent?
   - **Recommendation:** Phase 2 feature

2. **Webhook notifications:** Should we support Calendar API webhooks for real-time updates?
   - **Recommendation:** Phase 2 feature

3. **Calendar creation:** Should skill be able to create new calendars?
   - **Recommendation:** Yes, add `createCalendar()` function

4. **ACL management:** Should skill manage calendar sharing/permissions?
   - **Recommendation:** Phase 2 feature

5. **Attachment support:** Should events support file attachments?
   - **Recommendation:** Phase 2 feature (requires Drive API)

---

## Security Considerations

1. **Token Storage:**
   - File permissions: `0600`
   - Consider encryption at rest (Phase 2)
   - Never log tokens

2. **Scope Minimization:**
   - Request minimum required scopes
   - Allow users to select read-only vs full access

3. **Token Rotation:**
   - Refresh tokens before expiry
   - Handle revoked tokens gracefully

4. **API Key Protection:**
   - Store in environment variables
   - Never commit to version control
   - Use secret management in production

---

## Next Steps

After design approval:
1. Review design with team lead
2. Get guardian approval
3. Proceed to implementation (Step-064 execution)
4. Create Step-063 (File Operations Skill) design in parallel

---

**Status:** ⏳ Awaiting design review
