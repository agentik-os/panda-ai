/**
 * Google Calendar Skill - Integration Tests
 *
 * Comprehensive test suite for all calendar operations with mocked Google APIs
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GoogleCalendarSkill, OAuth2Manager } from '../src/index.js';
import type { calendar_v3 } from 'googleapis';

// ============================================================================
// Mock Setup (Module Level)
// ============================================================================

const mockEventsList = vi.fn();
const mockEventsGet = vi.fn();
const mockEventsInsert = vi.fn();
const mockEventsPatch = vi.fn();
const mockEventsDelete = vi.fn();
const mockCalendarsList = vi.fn();
const mockCalendarsGet = vi.fn();
const mockCalendarsInsert = vi.fn();
const mockCalendarsPatch = vi.fn();
const mockCalendarsDelete = vi.fn();
const mockFreebusyQuery = vi.fn();

// Mock Google APIs module
vi.mock('googleapis', () => ({
  google: {
    calendar: () => ({
      events: {
        list: mockEventsList,
        get: mockEventsGet,
        insert: mockEventsInsert,
        patch: mockEventsPatch,
        delete: mockEventsDelete,
      },
      calendarList: {
        list: mockCalendarsList,
      },
      calendars: {
        get: mockCalendarsGet,
        insert: mockCalendarsInsert,
        patch: mockCalendarsPatch,
        delete: mockCalendarsDelete,
      },
      freebusy: {
        query: mockFreebusyQuery,
      },
    }),
    auth: {
      OAuth2: class MockOAuth2 {
        credentials: any;

        constructor() {
          this.credentials = {
            access_token: 'mock_token',
            refresh_token: 'mock_refresh',
            expiry_date: Date.now() + 3600000,
          };
        }

        generateAuthUrl = vi.fn(() => 'https://accounts.google.com/o/oauth2/auth?mock=true');
        getToken = vi.fn(async (code: string) => ({
          tokens: {
            access_token: 'mock_access_token',
            refresh_token: 'mock_refresh_token',
            expiry_date: Date.now() + 3600000,
          },
        }));
        refreshAccessToken = vi.fn(async () => ({
          credentials: {
            access_token: 'refreshed_token',
            refresh_token: 'mock_refresh',
            expiry_date: Date.now() + 3600000,
          },
        }));
        setCredentials = vi.fn();
        revokeCredentials = vi.fn();
      },
    },
  },
}));

// ============================================================================
// Mock Data (Module Level)
// ============================================================================

const mockEvent: calendar_v3.Schema$Event = {
  id: 'event123',
  summary: 'Team Meeting',
  description: 'Weekly sync',
  location: 'Conference Room A',
  start: {
    dateTime: '2024-02-15T10:00:00-08:00',
    timeZone: 'America/Los_Angeles',
  },
  end: {
    dateTime: '2024-02-15T11:00:00-08:00',
    timeZone: 'America/Los_Angeles',
  },
  status: 'confirmed',
  created: '2024-02-10T12:00:00Z',
  updated: '2024-02-10T12:00:00Z',
  htmlLink: 'https://calendar.google.com/event?eid=xxx',
  attendees: [
    {
      email: 'user@example.com',
      responseStatus: 'accepted',
    },
  ],
  organizer: {
    email: 'organizer@example.com',
    displayName: 'John Doe',
  },
  reminders: {
    useDefault: false,
    overrides: [{ method: 'email', minutes: 30 }],
  },
};

const mockCalendar: calendar_v3.Schema$CalendarListEntry = {
  id: 'primary',
  summary: 'My Calendar',
  description: 'Primary calendar',
  timeZone: 'America/Los_Angeles',
  accessRole: 'owner',
  primary: true,
  backgroundColor: '#9fc6e7',
  foregroundColor: '#000000',
};

// ============================================================================
// Integration Tests
// ============================================================================

describe('GoogleCalendarSkill - Integration Tests', () => {
  let skill: GoogleCalendarSkill;
  let oauth: OAuth2Manager;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create skill instance
    skill = new GoogleCalendarSkill({
      clientId: 'test_client_id',
      clientSecret: 'test_client_secret',
      redirectUri: 'http://localhost:3000/callback',
      enableRateLimit: false, // Disable for testing
    });

    // Create OAuth manager instance for OAuth tests
    oauth = new OAuth2Manager({
      clientId: 'test_client_id',
      clientSecret: 'test_client_secret',
      redirectUri: 'http://localhost:3000/callback',
    });

    // Set credentials on skill
    skill.setCredentials({
      access_token: 'mock_token',
      refresh_token: 'mock_refresh',
      expiry_date: Date.now() + 3600000,
    });
  });

  // ============================================================================
  // OAuth Authentication (via OAuth2Manager)
  // ============================================================================

  describe('OAuth Authentication (OAuth2Manager)', () => {
    it('should generate auth URL', () => {
      const url = oauth.getAuthUrl();
      expect(url).toContain('https://accounts.google.com/o/oauth2');
    });

    it('should exchange code for tokens', async () => {
      const tokens = await oauth.getToken('auth_code');
      expect(tokens).toHaveProperty('access_token');
      expect(tokens).toHaveProperty('refresh_token');
    });

    it('should detect expired tokens', () => {
      oauth.setCredentials({
        access_token: 'expired',
        refresh_token: 'refresh',
        expiry_date: Date.now() - 1000,
      });
      expect(oauth.isTokenExpired()).toBe(true);
    });

    it('should detect valid tokens', () => {
      oauth.setCredentials({
        access_token: 'valid',
        refresh_token: 'refresh',
        expiry_date: Date.now() + 600000,
      });
      expect(oauth.isTokenExpired()).toBe(false);
    });
  });

  // ============================================================================
  // Event Operations
  // ============================================================================

  describe('Event Operations', () => {
    describe('listEvents', () => {
      it('should list events successfully', async () => {
        mockEventsList.mockResolvedValue({
          data: { items: [mockEvent] },
        });

        const result = await skill.execute({
          action: 'listEvents',
          params: { calendarId: 'primary' },
        });

        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(1);
        expect(mockEventsList).toHaveBeenCalledWith(
          expect.objectContaining({
            calendarId: 'primary',
          })
        );
      });

      it('should handle empty event list', async () => {
        mockEventsList.mockResolvedValue({
          data: { items: [] },
        });

        const result = await skill.execute({
          action: 'listEvents',
          params: { calendarId: 'primary' },
        });

        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(0);
      });

      it('should handle API errors', async () => {
        mockEventsList.mockRejectedValue(new Error('API Error'));

        const result = await skill.execute({
          action: 'listEvents',
          params: { calendarId: 'primary' },
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain('Failed to list events');
      });

      it('should filter by time range', async () => {
        mockEventsList.mockResolvedValue({
          data: { items: [mockEvent] },
        });

        const result = await skill.execute({
          action: 'listEvents',
          params: {
            calendarId: 'primary',
            timeMin: '2024-02-01T00:00:00Z',
            timeMax: '2024-02-29T23:59:59Z',
          },
        });

        expect(result.success).toBe(true);
        expect(mockEventsList).toHaveBeenCalledWith(
          expect.objectContaining({
            timeMin: '2024-02-01T00:00:00Z',
            timeMax: '2024-02-29T23:59:59Z',
          })
        );
      });
    });

    describe('searchEvents', () => {
      it('should search events by query', async () => {
        mockEventsList.mockResolvedValue({
          data: { items: [mockEvent] },
        });

        const result = await skill.execute({
          action: 'searchEvents',
          params: {
            calendarId: 'primary',
            query: 'meeting',
          },
        });

        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(1);
        expect(mockEventsList).toHaveBeenCalledWith(
          expect.objectContaining({
            q: 'meeting',
          })
        );
      });
    });

    describe('getEvent', () => {
      it('should get single event', async () => {
        mockEventsGet.mockResolvedValue({
          data: mockEvent,
        });

        const result = await skill.execute({
          action: 'getEvent',
          params: {
            calendarId: 'primary',
            eventId: 'event123',
          },
        });

        expect(result.success).toBe(true);
        expect(result.data).toHaveProperty('id', 'event123');
      });

      it('should handle event not found', async () => {
        mockEventsGet.mockRejectedValue({ code: 404 });

        const result = await skill.execute({
          action: 'getEvent',
          params: {
            calendarId: 'primary',
            eventId: 'nonexistent',
          },
        });

        expect(result.success).toBe(false);
      });
    });

    describe('createEvent', () => {
      it('should create event', async () => {
        mockEventsInsert.mockResolvedValue({
          data: mockEvent,
        });

        const result = await skill.execute({
          action: 'createEvent',
          params: {
            calendarId: 'primary',
            summary: 'Team Meeting',
            start: { dateTime: '2024-02-15T10:00:00-08:00' },
            end: { dateTime: '2024-02-15T11:00:00-08:00' },
          },
        });

        expect(result.success).toBe(true);
        expect(mockEventsInsert).toHaveBeenCalled();
      });

      it('should create all-day event', async () => {
        const allDayEvent = { ...mockEvent, start: { date: '2024-02-15' }, end: { date: '2024-02-16' } };
        mockEventsInsert.mockResolvedValue({
          data: allDayEvent,
        });

        const result = await skill.execute({
          action: 'createEvent',
          params: {
            calendarId: 'primary',
            summary: 'All Day Event',
            start: { date: '2024-02-15' },
            end: { date: '2024-02-16' },
          },
        });

        expect(result.success).toBe(true);
      });

      it('should handle invalid event data', async () => {
        mockEventsInsert.mockRejectedValue(new Error('Invalid data'));

        const result = await skill.execute({
          action: 'createEvent',
          params: {
            calendarId: 'primary',
            summary: '',
            start: {},
            end: {},
          },
        });

        expect(result.success).toBe(false);
      });
    });

    describe('updateEvent', () => {
      it('should update event', async () => {
        mockEventsPatch.mockResolvedValue({
          data: { ...mockEvent, summary: 'Updated Meeting' },
        });

        const result = await skill.execute({
          action: 'updateEvent',
          params: {
            calendarId: 'primary',
            eventId: 'event123',
            updates: {
              summary: 'Updated Meeting',
            },
          },
        });

        expect(result.success).toBe(true);
        expect(mockEventsPatch).toHaveBeenCalledWith(
          expect.objectContaining({
            calendarId: 'primary',
            eventId: 'event123',
          })
        );
      });

      it('should handle update of non-existent event', async () => {
        mockEventsPatch.mockRejectedValue({ code: 404 });

        const result = await skill.execute({
          action: 'updateEvent',
          params: {
            calendarId: 'primary',
            eventId: 'nonexistent',
            updates: {
              summary: 'Updated',
            },
          },
        });

        expect(result.success).toBe(false);
      });
    });

    describe('deleteEvent', () => {
      it('should delete event', async () => {
        mockEventsDelete.mockResolvedValue({ data: {} });

        const result = await skill.execute({
          action: 'deleteEvent',
          params: {
            calendarId: 'primary',
            eventId: 'event123',
          },
        });

        expect(result.success).toBe(true);
        expect(mockEventsDelete).toHaveBeenCalledWith({
          calendarId: 'primary',
          eventId: 'event123',
        });
      });

      it('should handle deletion of non-existent event', async () => {
        mockEventsDelete.mockRejectedValue({ code: 404 });

        const result = await skill.execute({
          action: 'deleteEvent',
          params: {
            calendarId: 'primary',
            eventId: 'nonexistent',
          },
        });

        expect(result.success).toBe(false);
      });
    });
  });

  // ============================================================================
  // Calendar Operations
  // ============================================================================

  describe('Calendar Operations', () => {
    it('should list calendars', async () => {
      mockCalendarsList.mockResolvedValue({
        data: { items: [mockCalendar] },
      });

      const result = await skill.execute({
        action: 'listCalendars',
        params: {},
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(mockCalendarsList).toHaveBeenCalled();
    });

    it('should handle empty calendar list', async () => {
      mockCalendarsList.mockResolvedValue({
        data: { items: [] },
      });

      const result = await skill.execute({
        action: 'listCalendars',
        params: {},
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });

    it('should get calendar', async () => {
      mockCalendarsGet.mockResolvedValue({
        data: mockCalendar,
      });

      const result = await skill.execute({
        action: 'getCalendar',
        params: { calendarId: 'primary' },
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('id', 'primary');
    });

    it('should handle calendar not found', async () => {
      mockCalendarsGet.mockRejectedValue({ code: 404 });

      const result = await skill.execute({
        action: 'getCalendar',
        params: { calendarId: 'nonexistent' },
      });

      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // Availability Checking
  // ============================================================================

  describe('Availability Checking', () => {
    it('should check availability with busy times', async () => {
      mockFreebusyQuery.mockResolvedValue({
        data: {
          timeMin: '2024-02-15T00:00:00-08:00',
          timeMax: '2024-02-15T23:59:59-08:00',
          calendars: {
            primary: {
              busy: [
                {
                  start: '2024-02-15T10:00:00-08:00',
                  end: '2024-02-15T11:00:00-08:00',
                },
              ],
            },
          },
        },
      });

      const result = await skill.execute({
        action: 'getFreeBusy',
        params: {
          calendars: ['primary'],
          timeMin: '2024-02-15T00:00:00-08:00',
          timeMax: '2024-02-15T23:59:59-08:00',
        },
      });

      expect(result.success).toBe(true);
      expect(result.data.calendars).toHaveProperty('primary');
      expect(result.data.calendars.primary.busy).toHaveLength(1);
      expect(mockFreebusyQuery).toHaveBeenCalled();
    });

    it('should handle fully free calendar', async () => {
      mockFreebusyQuery.mockResolvedValue({
        data: {
          timeMin: '2024-02-15T00:00:00-08:00',
          timeMax: '2024-02-15T23:59:59-08:00',
          calendars: {
            primary: {
              busy: [],
            },
          },
        },
      });

      const result = await skill.execute({
        action: 'getFreeBusy',
        params: {
          calendars: ['primary'],
          timeMin: '2024-02-15T00:00:00-08:00',
          timeMax: '2024-02-15T23:59:59-08:00',
        },
      });

      expect(result.success).toBe(true);
      expect(result.data.calendars.primary.busy).toHaveLength(0);
    });

    it('should check multiple calendars', async () => {
      mockFreebusyQuery.mockResolvedValue({
        data: {
          timeMin: '2024-02-15T00:00:00-08:00',
          timeMax: '2024-02-15T23:59:59-08:00',
          calendars: {
            primary: { busy: [] },
            work: { busy: [{ start: '2024-02-15T10:00:00-08:00', end: '2024-02-15T11:00:00-08:00' }] },
          },
        },
      });

      const result = await skill.execute({
        action: 'getFreeBusy',
        params: {
          calendars: ['primary', 'work'],
          timeMin: '2024-02-15T00:00:00-08:00',
          timeMax: '2024-02-15T23:59:59-08:00',
        },
      });

      expect(result.success).toBe(true);
      expect(result.data.calendars).toHaveProperty('primary');
      expect(result.data.calendars).toHaveProperty('work');
    });
  });

  // ============================================================================
  // Error Handling
  // ============================================================================

  describe('Error Handling', () => {
    it('should handle 401 Unauthorized', async () => {
      mockEventsList.mockRejectedValue({ code: 401, message: 'Invalid credentials' });

      const result = await skill.execute({
        action: 'listEvents',
        params: { calendarId: 'primary' },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle 429 Rate Limit', async () => {
      mockEventsList.mockRejectedValue({ code: 429, message: 'Too many requests' });

      const result = await skill.execute({
        action: 'listEvents',
        params: { calendarId: 'primary' },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to list events');
    });

    it('should handle 500 Server Error', async () => {
      mockEventsList.mockRejectedValue({ code: 500, message: 'Internal server error' });

      const result = await skill.execute({
        action: 'listEvents',
        params: { calendarId: 'primary' },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to list events');
    });

    it('should handle network errors', async () => {
      mockEventsList.mockRejectedValue(new Error('Network error'));

      const result = await skill.execute({
        action: 'listEvents',
        params: { calendarId: 'primary' },
      });

      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle null/undefined fields gracefully', async () => {
      const minimalEvent = { ...mockEvent, description: undefined, location: undefined };
      mockEventsGet.mockResolvedValue({
        data: minimalEvent,
      });

      const result = await skill.execute({
        action: 'getEvent',
        params: {
          calendarId: 'primary',
          eventId: 'event123',
        },
      });

      expect(result.success).toBe(true);
    });

    it('should handle very long descriptions', async () => {
      const longDesc = 'A'.repeat(10000);
      mockEventsInsert.mockResolvedValue({
        data: { ...mockEvent, description: longDesc },
      });

      const result = await skill.execute({
        action: 'createEvent',
        params: {
          calendarId: 'primary',
          summary: 'Test',
          description: longDesc,
          start: { dateTime: '2024-02-15T10:00:00-08:00' },
          end: { dateTime: '2024-02-15T11:00:00-08:00' },
        },
      });

      expect(result.success).toBe(true);
    });

    it('should handle special characters in summary', async () => {
      const specialSummary = 'Meeting with 🔥 @team & "important" discussion!';
      mockEventsInsert.mockResolvedValue({
        data: { ...mockEvent, summary: specialSummary },
      });

      const result = await skill.execute({
        action: 'createEvent',
        params: {
          calendarId: 'primary',
          summary: specialSummary,
          start: { dateTime: '2024-02-15T10:00:00-08:00' },
          end: { dateTime: '2024-02-15T11:00:00-08:00' },
        },
      });

      expect(result.success).toBe(true);
    });

    it('should handle different timezones', async () => {
      mockEventsInsert.mockResolvedValue({
        data: {
          ...mockEvent,
          start: { dateTime: '2024-02-15T18:00:00+00:00', timeZone: 'UTC' },
          end: { dateTime: '2024-02-15T19:00:00+00:00', timeZone: 'UTC' },
        },
      });

      const result = await skill.execute({
        action: 'createEvent',
        params: {
          calendarId: 'primary',
          summary: 'UTC Meeting',
          start: { dateTime: '2024-02-15T18:00:00+00:00', timeZone: 'UTC' },
          end: { dateTime: '2024-02-15T19:00:00+00:00', timeZone: 'UTC' },
        },
      });

      expect(result.success).toBe(true);
    });
  });
});
