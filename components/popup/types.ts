export type Tab = "meetings" | "live" | "ai" | "settings"
export type LiveState = "loading" | "waiting" | "active"

export interface CalendarEvent {
  id: string
  summary?: string
  start: { dateTime?: string; date?: string }
  end: { dateTime?: string; date?: string }
  attendees?: { email: string; displayName?: string }[]
  conferenceData?: { entryPoints?: { uri: string; entryPointType: string }[] }
}

export interface MeetingGroup {
  title: string
  dateLabel: string
  duration: number
  session: string
}
