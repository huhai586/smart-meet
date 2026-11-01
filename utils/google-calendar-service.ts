/**
 * Google Calendar Service
 * Fetches calendar events via the Calendar REST API v3, with the token of the extension's one Google sign-in
 * (see utils/google-account).
 */
import {
  GoogleStorageKey,
  clearGoogleSession,
  getGoogleToken,
  signInGoogle,
  signOutGoogle,
  type GoogleUser,
} from '~utils/google-account';

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime?: string; date?: string; timeZone?: string };
  end: { dateTime?: string; date?: string; timeZone?: string };
  attendees?: Array<{ email: string; displayName?: string; responseStatus?: string }>;
  hangoutLink?: string;
  conferenceData?: {
    entryPoints?: Array<{ entryPointType: string; uri: string }>;
  };
}

export type CalendarUser = GoogleUser;

const CONNECTED_KEY = GoogleStorageKey.CALENDAR_CONNECTED;
const USER_KEY = GoogleStorageKey.CALENDAR_USER;

export class GoogleCalendarService {
  private static instance: GoogleCalendarService;
  private accessToken: string | null = null;

  private constructor() {}

  static getInstance(): GoogleCalendarService {
    if (!GoogleCalendarService.instance) {
      GoogleCalendarService.instance = new GoogleCalendarService();
    }
    return GoogleCalendarService.instance;
  }

  private getAuthToken(interactive: boolean): Promise<string | null> {
    return getGoogleToken(interactive);
  }

  /** Try to restore a cached token without prompting the user. */
  async checkConnection(): Promise<boolean> {
    const token = await this.getAuthToken(false);
    if (!token) {
      await clearGoogleSession();
      this.accessToken = null;
      return false;
    }
    this.accessToken = token;
    return true;
  }

  /** Signs in to Google, which connects Calendar and Drive together. */
  async connect(): Promise<{ success: boolean; user: CalendarUser | null }> {
    const user = await signInGoogle();
    if (!user) return { success: false, user: null };
    this.accessToken = await this.getAuthToken(false);
    return { success: true, user };
  }

  /** Signs out of Google on this device; Drive is signed out with it. */
  async disconnect(): Promise<void> {
    await signOutGoogle();
    this.accessToken = null;
  }

  /** Load persisted connection state (used on mount without a network call). */
  async getPersistedState(): Promise<{ connected: boolean; user: CalendarUser | null }> {
    return new Promise((resolve) => {
      chrome.storage.local.get([CONNECTED_KEY, USER_KEY], (result) => {
        resolve({
          connected: !!result[CONNECTED_KEY],
          user: (result[USER_KEY] as CalendarUser) ?? null,
        });
      });
    });
  }

  /**
   * Fetch upcoming events from the primary calendar.
   * @param daysAhead  How many days into the future to query (e.g. 30)
   */
  async getUpcomingEvents(daysAhead: number = 30): Promise<CalendarEvent[]> {
    if (!this.accessToken) {
      this.accessToken = await this.getAuthToken(false);
    }
    if (!this.accessToken) throw new Error('Not authenticated');

    const timeMin = new Date().toISOString();
    const timeMax = new Date(Date.now() + daysAhead * 86_400_000).toISOString();

    const params = new URLSearchParams({
      calendarId: 'primary',
      timeMin,
      timeMax,
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '250',
      fields: 'items(id,summary,description,location,start,end,attendees,hangoutLink,conferenceData)',
    });

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
      { headers: { Authorization: `Bearer ${this.accessToken}` } }
    );

    if (res.status === 401) {
      // Token expired – remove and signal caller
      chrome.identity.removeCachedAuthToken({ token: this.accessToken }, () => {});
      this.accessToken = null;
      await clearGoogleSession();
      throw new Error('TOKEN_EXPIRED');
    }

    if (!res.ok) {
      throw new Error(`Calendar API error: ${res.status}`);
    }

    const data = await res.json();
    return (data.items ?? []) as CalendarEvent[];
  }
}

export default GoogleCalendarService;
