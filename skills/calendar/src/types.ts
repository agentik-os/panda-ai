/**
 * Google Calendar Skill - Type Definitions
 */

import type { SkillInput, SkillOutput } from '../../../packages/sdk/src/index.js';

// ============================================================================
// Skill Input/Output Types (SkillBase integration)
// ============================================================================

export interface CalendarInput extends SkillInput {
  action: 'listCalendars' | 'getCalendar' | 'createEvent' | 'getEvent' |
          'updateEvent' | 'deleteEvent' | 'listEvents' | 'searchEvents' |
          'getFreeBusy' | 'createRecurringEvent' | 'updateRecurringInstance' |
          'quickAdd' | 'move';
  params: Record<string, unknown>;
}

export interface CalendarOutput extends SkillOutput {
  data?: unknown;
  executionTime: number;
}

// ============================================================================
// Core Types
// ============================================================================

export interface Calendar {
  id: string;
  summary: string;
  description?: string | null;
  timeZone: string;
  accessRole: 'owner' | 'writer' | 'reader' | 'freeBusyReader';
  primary?: boolean | null;
  backgroundColor?: string | null;
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

export interface Organizer {
  email: string;
  displayName?: string;
  self?: boolean;
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
  pin?: string;
}

// ============================================================================
// Function Parameter Types
// ============================================================================

export interface ListCalendarsOptions {
  maxResults?: number;
  showHidden?: boolean;
}

export interface CreateEventParams {
  calendarId: string;
  summary: string;
  description?: string;
  location?: string;
  start: EventDateTime;
  end: EventDateTime;
  attendees?: string[] | Attendee[];
  reminders?: Reminders;
  conferenceData?: ConferenceData;
  sendNotifications?: boolean;
}

export interface UpdateEventParams {
  calendarId: string;
  eventId: string;
  updates: Partial<CreateEventParams>;
  sendNotifications?: boolean;
}

export interface DeleteEventParams {
  calendarId: string;
  eventId: string;
  sendNotifications?: boolean;
}

export interface ListEventsParams {
  calendarId: string;
  timeMin?: string; // ISO 8601
  timeMax?: string; // ISO 8601
  maxResults?: number;
  orderBy?: 'startTime' | 'updated';
  showDeleted?: boolean;
}

export interface SearchEventsParams {
  calendarId: string;
  query: string;
  timeMin?: string;
  timeMax?: string;
  maxResults?: number;
}

export interface FreeBusyParams {
  calendars: string[];
  timeMin: string; // ISO 8601
  timeMax: string; // ISO 8601
  timeZone?: string;
}

export interface FreeBusyResponse {
  calendars: Record<string, CalendarFreeBusy>;
  timeMin: string;
  timeMax: string;
}

export interface CalendarFreeBusy {
  busy: TimePeriod[];
  errors?: Array<{
    domain: string;
    reason: string;
  }>;
}

export interface TimePeriod {
  start: string; // ISO 8601
  end: string;   // ISO 8601
}

export interface CreateRecurringEventParams extends CreateEventParams {
  recurrence: string[]; // RRULE strings
}

export interface UpdateRecurringInstanceParams {
  calendarId: string;
  eventId: string;
  instanceId: string;
  updates: Partial<CreateEventParams>;
  sendNotifications?: boolean;
}

export interface MoveEventParams {
  sourceCalendarId: string;
  destinationCalendarId: string;
  eventId: string;
  sendNotifications?: boolean;
}

// ============================================================================
// OAuth2 Types
// ============================================================================

export interface OAuth2Credentials {
  access_token: string;
  refresh_token?: string;
  scope: string;
  token_type: string;
  expiry_date?: number;
}

export interface OAuth2Config {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface GoogleCalendarConfig {
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  defaultCalendar?: string;
  timeZone?: string;
  enableRateLimit?: boolean;
}

// ============================================================================
// Error Types
// ============================================================================

export class CalendarError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'CalendarError';
  }
}

export class AuthenticationError extends CalendarError {
  constructor(message: string, details?: unknown) {
    super(message, 'AUTHENTICATION_ERROR', details);
    this.name = 'AuthenticationError';
  }
}

export class RateLimitError extends CalendarError {
  constructor(message: string, details?: unknown) {
    super(message, 'RATE_LIMIT_ERROR', details);
    this.name = 'RateLimitError';
  }
}

export class NotFoundError extends CalendarError {
  constructor(message: string, details?: unknown) {
    super(message, 'NOT_FOUND', details);
    this.name = 'NotFoundError';
  }
}
