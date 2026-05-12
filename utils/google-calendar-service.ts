/**
 * Google Calendar Service
 * Uses chrome.identity (same pattern as GoogleDriveService) to authenticate
 * and fetch calendar events via the Calendar REST API v3.
 */

const CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
];

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

export interface CalendarUser {
  email: string;
  name: string;
  picture: string;
}

const CONNECTED_KEY = 'calendarConnected';
const USER_KEY = 'calendarUser';

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
    return new Promise((resolve) => {
      chrome.identity.getAuthToken({ interactive, scopes: CALENDAR_SCOPES }, (token) => {
        if (chrome.runtime.lastError) {
          console.warn('[CalendarService] getAuthToken error:', chrome.runtime.lastError.message);
          resolve(null);
        } else {
          resolve(token ?? null);
        }
      });
    });
  }

  private async fetchUserInfo(token: string): Promise<CalendarUser | null> {
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      const data = await res.json();
      return { email: data.email, name: data.name, picture: data.picture };
    } catch {
      return null;
    }
  }

  /** Try to restore a cached token without prompting the user. */
  async checkConnection(): Promise<boolean> {
    const token = await this.getAuthToken(false);
    if (!token) {
      await chrome.storage.local.remove([CONNECTED_KEY, USER_KEY]);
      this.accessToken = null;
      return false;
    }
    this.accessToken = token;
    return true;
  }

  /** Interactively authenticate and persist the connected state. */
  async connect(): Promise<{ success: boolean; user: CalendarUser | null }> {
    // Clear any stale cached token first
    const stale = await this.getAuthToken(false);
    if (stale) {
      await new Promise<void>((r) =>
        chrome.identity.removeCachedAuthToken({ token: stale }, r)
      );
    }

    const token = await this.getAuthToken(true);
    if (!token) return { success: false, user: null };

    this.accessToken = token;
    const user = await this.fetchUserInfo(token);

    await chrome.storage.local.set({
      [CONNECTED_KEY]: true,
      [USER_KEY]: user,
    });

    return { success: true, user };
  }

  /** Revoke and clear the calendar token. */
  async disconnect(): Promise<void> {
    const token = await this.getAuthToken(false);
    if (token) {
      chrome.identity.removeCachedAuthToken({ token }, () => {});
      try {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, { method: 'POST' });
      } catch { /* best-effort revoke */ }
    }
    this.accessToken = null;
    await chrome.storage.local.remove([CONNECTED_KEY, USER_KEY]);
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
      await chrome.storage.local.remove([CONNECTED_KEY, USER_KEY]);
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
