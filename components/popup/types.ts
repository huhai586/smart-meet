export interface CalendarEvent {
  id: string
  summary?: string
  start: { dateTime?: string; date?: string }
  end: { dateTime?: string; date?: string }
  attendees?: { email: string; displayName?: string }[]
  conferenceData?: { entryPoints?: { uri: string; entryPointType: string }[] }
}
