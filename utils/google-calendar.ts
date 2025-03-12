import dayjs from 'dayjs';

declare global {
  interface Window {
    gapi: any;
  }
}

interface GoogleCalendarEvent {
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

class GoogleCalendarService {
  private static instance: GoogleCalendarService;
  private apiKey: string;
  private clientId: string;

  private constructor() {
    // 从环境变量或配置中获取
    this.apiKey = 'YOUR_API_KEY';
    this.clientId = 'YOUR_CLIENT_ID';
  }

  public static getInstance(): GoogleCalendarService {
    if (!GoogleCalendarService.instance) {
      GoogleCalendarService.instance = new GoogleCalendarService();
    }
    return GoogleCalendarService.instance;
  }

  private async initializeGoogleApi(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window.gapi !== 'undefined') {
        window.gapi.load('client:auth2', async () => {
          try {
            await window.gapi.client.init({
              apiKey: this.apiKey,
              clientId: this.clientId,
              discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
              scope: 'https://www.googleapis.com/auth/calendar.readonly'
            });
            resolve();
          } catch (error) {
            reject(error);
          }
        });
      } else {
        reject(new Error('Google API not loaded'));
      }
    });
  }

  public async signIn(): Promise<void> {
    await this.initializeGoogleApi();
    const googleAuth = window.gapi.auth2.getAuthInstance();
    if (!googleAuth.isSignedIn.get()) {
      await googleAuth.signIn();
    }
  }

  public async signOut(): Promise<void> {
    const googleAuth = window.gapi.auth2.getAuthInstance();
    await googleAuth.signOut();
  }

  public async getEvents(startDate: dayjs.Dayjs, endDate: dayjs.Dayjs): Promise<GoogleCalendarEvent[]> {
    try {
      await this.initializeGoogleApi();
      
      const response = await window.gapi.client.calendar.events.list({
        'calendarId': 'primary',
        'timeMin': startDate.toISOString(),
        'timeMax': endDate.toISOString(),
        'showDeleted': false,
        'singleEvents': true,
        'orderBy': 'startTime'
      });

      return response.result.items;
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      throw error;
    }
  }
}

export default GoogleCalendarService; 