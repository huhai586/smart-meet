/**
 * Google API (gapi) type definitions
 */

export interface GapiClient {
  init: (config: GapiInitConfig) => Promise<void>;
  calendar: {
    events: {
      list: (params: CalendarEventListParams) => Promise<CalendarEventListResponse>;
    };
  };
}

export interface GapiAuth2 {
  getAuthInstance: () => AuthInstance;
}

export interface AuthInstance {
  isSignedIn: {
    get: () => boolean;
  };
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

export interface GapiInitConfig {
  apiKey: string;
  clientId: string;
  discoveryDocs: string[];
  scope: string;
}

export interface CalendarEventListParams {
  calendarId: string;
  timeMin: string;
  timeMax: string;
  showDeleted: boolean;
  singleEvents: boolean;
  orderBy: string;
}

export interface CalendarEventListResponse {
  result: {
    items: GoogleCalendarEvent[];
  };
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
}

export interface WindowWithGapi extends Window {
  gapi: {
    load: (apis: string, callback: () => void) => void;
    client: GapiClient;
    auth2: GapiAuth2;
  };
}
