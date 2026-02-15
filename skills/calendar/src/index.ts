/**
 * Google Calendar Skill - Main Entry Point
 *
 * Comprehensive Google Calendar integration with OAuth2 authentication,
 * event management, scheduling, and availability checking.
 */

import { google } from 'googleapis';
import type { calendar_v3 } from 'googleapis';
import { SkillBase } from '../../../packages/sdk/src/index.js';
import { OAuth2Manager } from './auth.js';
import type {
  CalendarInput,
  CalendarOutput,
  GoogleCalendarConfig,
  Calendar,
  CalendarEvent,
  CreateEventParams,
  UpdateEventParams,
  DeleteEventParams,
  ListEventsParams,
  SearchEventsParams,
  FreeBusyParams,
  FreeBusyResponse,
  ListCalendarsOptions,
  CreateRecurringEventParams,
  UpdateRecurringInstanceParams,
  MoveEventParams,
  OAuth2Credentials,
  EventDateTime,
  Attendee,
  Organizer,
  Reminders,
  ConferenceData,
} from './types.js';
import {
  CalendarError,
  RateLimitError,
  NotFoundError,
} from './types.js';

// ============================================================================
// Rate Limiter
// ============================================================================

class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests = 600, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  canMakeRequest(): boolean {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    return this.requests.length < this.maxRequests;
  }

  recordRequest(): void {
    this.requests.push(Date.now());
  }

  getRemainingRequests(): number {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    return Math.max(0, this.maxRequests - this.requests.length);
  }
}

// ============================================================================
// Google Calendar Skill Class
// ============================================================================

export class GoogleCalendarSkill extends SkillBase<CalendarInput, CalendarOutput> {
  // Required metadata
  readonly id = 'google-calendar';
  readonly name = 'Google Calendar';
  readonly description = 'Manage Google Calendar events, schedules, and availability with OAuth2 authentication';
  readonly version = '1.0.0';

  // Optional metadata
  readonly author = 'Agentik OS';
  readonly permissions = [
    'network:https:www.googleapis.com',
    'network:https:oauth2.googleapis.com',
    'api:google:calendar',
    'fs:read:~/.agentik-os/data/credentials/google-calendar.json',
    'fs:write:~/.agentik-os/data/credentials/google-calendar.json',
    'kv:read:google_calendar:*',
    'kv:write:google_calendar:*',
  ];
  readonly tags = ['calendar', 'google', 'scheduling', 'oauth2', 'events'];

  // Private instances
  private oauth: OAuth2Manager;
  private rateLimiter: RateLimiter;
  private calendarApi: ReturnType<typeof google.calendar>;

  constructor(config: GoogleCalendarConfig = {}) {
    // Merge config with environment variables and defaults
    const mergedConfig = {
      clientId: config.clientId || process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: config.clientSecret || process.env.GOOGLE_CLIENT_SECRET || '',
      redirectUri: config.redirectUri || process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/oauth/callback',
      defaultCalendar: config.defaultCalendar || 'primary',
      timeZone: config.timeZone || 'America/Los_Angeles',
      enableRateLimit: config.enableRateLimit ?? true,
    };

    super(mergedConfig);

    // Initialize OAuth2 manager
    this.oauth = new OAuth2Manager({
      clientId: mergedConfig.clientId,
      clientSecret: mergedConfig.clientSecret,
      redirectUri: mergedConfig.redirectUri,
    });

    // Initialize rate limiter (600 requests/minute = 10/second)
    this.rateLimiter = new RateLimiter(600, 60000);

    // Initialize Calendar API
    this.calendarApi = google.calendar({ version: 'v3', auth: this.oauth.getClient() });
  }

  /**
   * Main execution method (SkillBase implementation)
   */
  async execute(input: CalendarInput): Promise<CalendarOutput> {
    const startTime = Date.now();

    try {
      // Check rate limit
      if (this.config.enableRateLimit && !this.rateLimiter.canMakeRequest()) {
        throw new RateLimitError(
          `Rate limit exceeded. Remaining: ${this.rateLimiter.getRemainingRequests()}/600 per minute`
        );
      }

      // Record request
      if (this.config.enableRateLimit) {
        this.rateLimiter.recordRequest();
      }

      // Ensure valid OAuth token
      await this.oauth.ensureValidToken();

      // Route to appropriate function
      let data: unknown;

      switch (input.action) {
        case 'listCalendars':
          data = await this.listCalendars(input.params as unknown as ListCalendarsOptions);
          break;
        case 'getCalendar':
          data = await this.getCalendar(input.params.calendarId as unknown as string);
          break;
        case 'createEvent':
          data = await this.createEvent(input.params as unknown as CreateEventParams);
          break;
        case 'getEvent':
          data = await this.getEvent(
            input.params.calendarId as unknown as string,
            input.params.eventId as unknown as string
          );
          break;
        case 'updateEvent':
          data = await this.updateEvent(input.params as unknown as UpdateEventParams);
          break;
        case 'deleteEvent':
          data = await this.deleteEvent(input.params as unknown as DeleteEventParams);
          break;
        case 'listEvents':
          data = await this.listEvents(input.params as unknown as ListEventsParams);
          break;
        case 'searchEvents':
          data = await this.searchEvents(input.params as unknown as SearchEventsParams);
          break;
        case 'getFreeBusy':
          data = await this.getFreeBusy(input.params as unknown as FreeBusyParams);
          break;
        case 'createRecurringEvent':
          data = await this.createRecurringEvent(input.params as unknown as CreateRecurringEventParams);
          break;
        case 'updateRecurringInstance':
          data = await this.updateRecurringInstance(input.params as unknown as UpdateRecurringInstanceParams);
          break;
        case 'quickAdd':
          data = await this.quickAdd(
            input.params.calendarId as unknown as string,
            input.params.text as unknown as string
          );
          break;
        case 'move':
          data = await this.move(input.params as unknown as MoveEventParams);
          break;
        default:
          throw new CalendarError(`Unknown action: ${input.action}`, 'INVALID_ACTION');
      }

      return {
        success: true,
        data,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      this.log('error', `Calendar operation failed: ${error instanceof Error ? error.message : String(error)}`, {
        action: input.action,
        error: error instanceof Error ? error.stack : String(error),
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        executionTime: Date.now() - startTime,
      };
    }
  }

  // ============================================================================
  // Calendar Management
  // ============================================================================

  /**
   * List all accessible calendars
   */
  async listCalendars(options: ListCalendarsOptions = {}): Promise<Calendar[]> {
    try {
      const response = await this.calendarApi.calendarList.list({
        maxResults: options.maxResults,
        showHidden: options.showHidden,
      });

      return (response.data.items || []).map(cal => ({
        id: cal.id!,
        summary: cal.summary!,
        description: cal.description,
        timeZone: cal.timeZone!,
        accessRole: cal.accessRole as Calendar['accessRole'],
        primary: cal.primary,
        backgroundColor: cal.backgroundColor,
      }));
    } catch (error) {
      throw new CalendarError(
        `Failed to list calendars: ${error instanceof Error ? error.message : String(error)}`,
        'LIST_CALENDARS_FAILED',
        error
      );
    }
  }

  /**
   * Get details of a specific calendar
   */
  async getCalendar(calendarId: string): Promise<Calendar> {
    try {
      const response = await this.calendarApi.calendars.get({ calendarId });

      return {
        id: response.data.id!,
        summary: response.data.summary!,
        description: response.data.description,
        timeZone: response.data.timeZone!,
        accessRole: 'owner', // Default for retrieved calendar
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        throw new NotFoundError(`Calendar not found: ${calendarId}`);
      }
      throw new CalendarError(
        `Failed to get calendar: ${error instanceof Error ? error.message : String(error)}`,
        'GET_CALENDAR_FAILED',
        error
      );
    }
  }

  // ============================================================================
  // Event CRUD
  // ============================================================================

  /**
   * Create a new calendar event
   */
  async createEvent(params: CreateEventParams): Promise<CalendarEvent> {
    try {
      const attendees = params.attendees?.map(a =>
        typeof a === 'string' ? { email: a } : a
      );

      const response = await this.calendarApi.events.insert({
        calendarId: params.calendarId,
        sendNotifications: params.sendNotifications,
        requestBody: {
          summary: params.summary,
          description: params.description,
          location: params.location,
          start: params.start,
          end: params.end,
          attendees,
          reminders: params.reminders,
          conferenceData: params.conferenceData,
        },
      });

      return this.mapEvent(response.data, params.calendarId);
    } catch (error) {
      throw new CalendarError(
        `Failed to create event: ${error instanceof Error ? error.message : String(error)}`,
        'CREATE_EVENT_FAILED',
        error
      );
    }
  }

  /**
   * Get a specific event
   */
  async getEvent(calendarId: string, eventId: string): Promise<CalendarEvent> {
    try {
      const response = await this.calendarApi.events.get({
        calendarId,
        eventId,
      });

      return this.mapEvent(response.data, calendarId);
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        throw new NotFoundError(`Event not found: ${eventId}`);
      }
      throw new CalendarError(
        `Failed to get event: ${error instanceof Error ? error.message : String(error)}`,
        'GET_EVENT_FAILED',
        error
      );
    }
  }

  /**
   * Update an existing event
   */
  async updateEvent(params: UpdateEventParams): Promise<CalendarEvent> {
    try {
      const attendees = params.updates.attendees?.map(a =>
        typeof a === 'string' ? { email: a } : a
      );

      const response = await this.calendarApi.events.patch({
        calendarId: params.calendarId,
        eventId: params.eventId,
        sendNotifications: params.sendNotifications,
        requestBody: {
          summary: params.updates.summary,
          description: params.updates.description,
          location: params.updates.location,
          start: params.updates.start,
          end: params.updates.end,
          attendees,
          reminders: params.updates.reminders,
        },
      });

      return this.mapEvent(response.data, params.calendarId);
    } catch (error) {
      throw new CalendarError(
        `Failed to update event: ${error instanceof Error ? error.message : String(error)}`,
        'UPDATE_EVENT_FAILED',
        error
      );
    }
  }

  /**
   * Delete an event
   */
  async deleteEvent(params: DeleteEventParams): Promise<void> {
    try {
      await this.calendarApi.events.delete({
        calendarId: params.calendarId,
        eventId: params.eventId,
        sendNotifications: params.sendNotifications,
      });
    } catch (error) {
      throw new CalendarError(
        `Failed to delete event: ${error instanceof Error ? error.message : String(error)}`,
        'DELETE_EVENT_FAILED',
        error
      );
    }
  }

  // ============================================================================
  // Event Listing & Search
  // ============================================================================

  /**
   * List events in a calendar
   */
  async listEvents(params: ListEventsParams): Promise<CalendarEvent[]> {
    try {
      const response = await this.calendarApi.events.list({
        calendarId: params.calendarId,
        timeMin: params.timeMin,
        timeMax: params.timeMax,
        maxResults: params.maxResults || 250,
        orderBy: params.orderBy,
        showDeleted: params.showDeleted,
        singleEvents: true, // Expand recurring events
      });

      return (response.data.items || []).map(event =>
        this.mapEvent(event, params.calendarId)
      );
    } catch (error) {
      throw new CalendarError(
        `Failed to list events: ${error instanceof Error ? error.message : String(error)}`,
        'LIST_EVENTS_FAILED',
        error
      );
    }
  }

  /**
   * Search events by query string
   */
  async searchEvents(params: SearchEventsParams): Promise<CalendarEvent[]> {
    try {
      const response = await this.calendarApi.events.list({
        calendarId: params.calendarId,
        q: params.query,
        timeMin: params.timeMin,
        timeMax: params.timeMax,
        maxResults: params.maxResults || 25,
        singleEvents: true,
      });

      return (response.data.items || []).map(event =>
        this.mapEvent(event, params.calendarId)
      );
    } catch (error) {
      throw new CalendarError(
        `Failed to search events: ${error instanceof Error ? error.message : String(error)}`,
        'SEARCH_EVENTS_FAILED',
        error
      );
    }
  }

  // ============================================================================
  // Availability
  // ============================================================================

  /**
   * Get free/busy information
   */
  async getFreeBusy(params: FreeBusyParams): Promise<FreeBusyResponse> {
    try {
      const response = await this.calendarApi.freebusy.query({
        requestBody: {
          timeMin: params.timeMin,
          timeMax: params.timeMax,
          timeZone: params.timeZone,
          items: params.calendars.map(id => ({ id })),
        },
      });

      const calendars: Record<string, any> = {};

      for (const [calendarId, data] of Object.entries(response.data.calendars || {})) {
        calendars[calendarId] = {
          busy: (data.busy || []).map((period: calendar_v3.Schema$TimePeriod) => ({
            start: period.start!,
            end: period.end!,
          })),
          errors: data.errors,
        };
      }

      return {
        calendars,
        timeMin: response.data.timeMin!,
        timeMax: response.data.timeMax!,
      };
    } catch (error) {
      throw new CalendarError(
        `Failed to get free/busy: ${error instanceof Error ? error.message : String(error)}`,
        'GET_FREEBUSY_FAILED',
        error
      );
    }
  }

  // ============================================================================
  // Recurring Events
  // ============================================================================

  /**
   * Create a recurring event
   */
  async createRecurringEvent(params: CreateRecurringEventParams): Promise<CalendarEvent> {
    try {
      const attendees = params.attendees?.map(a =>
        typeof a === 'string' ? { email: a } : a
      );

      const response = await this.calendarApi.events.insert({
        calendarId: params.calendarId,
        sendNotifications: params.sendNotifications,
        requestBody: {
          summary: params.summary,
          description: params.description,
          location: params.location,
          start: params.start,
          end: params.end,
          recurrence: params.recurrence,
          attendees,
          reminders: params.reminders,
        },
      });

      return this.mapEvent(response.data, params.calendarId);
    } catch (error) {
      throw new CalendarError(
        `Failed to create recurring event: ${error instanceof Error ? error.message : String(error)}`,
        'CREATE_RECURRING_FAILED',
        error
      );
    }
  }

  /**
   * Update a specific instance of a recurring event
   */
  async updateRecurringInstance(params: UpdateRecurringInstanceParams): Promise<CalendarEvent> {
    try {
      // First get the instance
      const instance = await this.calendarApi.events.instances({
        calendarId: params.calendarId,
        eventId: params.eventId,
      });

      const targetInstance = instance.data.items?.find(
        i => i.id === params.instanceId
      );

      if (!targetInstance) {
        throw new NotFoundError(`Recurring instance not found: ${params.instanceId}`);
      }

      // Update the instance
      const requestBody: Record<string, unknown> = {};

      if (params.updates.summary) requestBody.summary = params.updates.summary;
      if (params.updates.description) requestBody.description = params.updates.description;
      if (params.updates.location) requestBody.location = params.updates.location;
      if (params.updates.start) requestBody.start = params.updates.start;
      if (params.updates.end) requestBody.end = params.updates.end;
      if (params.updates.attendees) {
        requestBody.attendees = (params.updates.attendees as unknown[]).map(a =>
          typeof a === 'string' ? { email: a } : a
        );
      }
      if (params.updates.reminders) requestBody.reminders = params.updates.reminders;
      if (params.updates.conferenceData) requestBody.conferenceData = params.updates.conferenceData;

      const response = await this.calendarApi.events.patch({
        calendarId: params.calendarId,
        eventId: params.instanceId,
        sendNotifications: params.sendNotifications,
        requestBody,
      });

      return this.mapEvent(response.data, params.calendarId);
    } catch (error) {
      throw new CalendarError(
        `Failed to update recurring instance: ${error instanceof Error ? error.message : String(error)}`,
        'UPDATE_RECURRING_INSTANCE_FAILED',
        error
      );
    }
  }

  // ============================================================================
  // Utility Functions
  // ============================================================================

  /**
   * Quick add event using natural language
   */
  async quickAdd(calendarId: string, text: string): Promise<CalendarEvent> {
    try {
      const response = await this.calendarApi.events.quickAdd({
        calendarId,
        text,
      });

      return this.mapEvent(response.data, calendarId);
    } catch (error) {
      throw new CalendarError(
        `Failed to quick add event: ${error instanceof Error ? error.message : String(error)}`,
        'QUICK_ADD_FAILED',
        error
      );
    }
  }

  /**
   * Move event to another calendar
   */
  async move(params: MoveEventParams): Promise<CalendarEvent> {
    try {
      const response = await this.calendarApi.events.move({
        calendarId: params.sourceCalendarId,
        eventId: params.eventId,
        destination: params.destinationCalendarId,
        sendNotifications: params.sendNotifications,
      });

      return this.mapEvent(response.data, params.destinationCalendarId);
    } catch (error) {
      throw new CalendarError(
        `Failed to move event: ${error instanceof Error ? error.message : String(error)}`,
        'MOVE_EVENT_FAILED',
        error
      );
    }
  }

  // ============================================================================
  // OAuth2 Public Methods
  // ============================================================================

  /**
   * Get authorization URL for OAuth2 flow
   */
  getAuthorizationUrl(): string {
    return this.oauth.getAuthUrl();
  }

  /**
   * Exchange authorization code for tokens
   */
  async authorize(code: string): Promise<void> {
    await this.oauth.getToken(code);
  }

  /**
   * Set existing OAuth2 credentials
   */
  setCredentials(credentials: OAuth2Credentials): void {
    this.oauth.setCredentials(credentials);
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Map Google Calendar API event to our CalendarEvent type
   */
  private mapEvent(event: calendar_v3.Schema$Event, calendarId: string): CalendarEvent {
    return {
      id: event.id!,
      calendarId,
      summary: event.summary || '(No title)',
      description: event.description ?? undefined,
      location: event.location ?? undefined,
      start: event.start as unknown as EventDateTime,
      end: event.end as unknown as EventDateTime,
      recurrence: event.recurrence ?? undefined,
      attendees: event.attendees as unknown as Attendee[] | undefined,
      organizer: event.organizer as unknown as Organizer | undefined,
      status: (event.status || 'confirmed') as 'confirmed' | 'tentative' | 'cancelled',
      created: event.created!,
      updated: event.updated!,
      htmlLink: event.htmlLink!,
      reminders: event.reminders as unknown as Reminders | undefined,
      conferenceData: event.conferenceData as unknown as ConferenceData | undefined,
    };
  }

  /**
   * Get remaining rate limit quota
   */
  getRemainingQuota(): number {
    return this.rateLimiter.getRemainingRequests();
  }
}

// ============================================================================
// Exported Functions (for WASM/MCP integration)
// ============================================================================

let skillInstance: GoogleCalendarSkill | null = null;

/**
 * Initialize the Google Calendar skill
 */
export function initialize(config?: GoogleCalendarConfig): void {
  skillInstance = new GoogleCalendarSkill(config);
}

/**
 * Execute a calendar action
 */
export async function execute(input: CalendarInput): Promise<CalendarOutput> {
  if (!skillInstance) {
    initialize();
  }
  return skillInstance!.execute(input);
}

/**
 * Get remaining API quota
 */
export function getQuota(): number {
  if (!skillInstance) {
    initialize();
  }
  return skillInstance!.getRemainingQuota();
}

// Default export
export default {
  initialize,
  execute,
  getQuota,
  GoogleCalendarSkill,
};

// Re-export types
export type * from './types.js';
export { OAuth2Manager } from './auth.js';
