import { useEffect, useState } from "react"
import dayjs, { type Dayjs } from "dayjs"
import type { CalendarEvent } from "~/components/popup/types"

/** A Meet room address (`/abc-defg-hij`, also under `/meet/`); the Meet landing and lookup pages are not a meeting. */
const MEET_ROOM_PATH = /^\/(?:meet\/)?[a-z]{3}-[a-z]{4}-[a-z]{3}\/?$/

export interface LiveMeeting {
  tabId: number
  windowId: number
  title: string
}

export interface NextMeeting {
  evt: CalendarEvent
  start: Dayjs
  end: Dayjs
  joinUrl?: string
  minsUntil: number
  isOngoing: boolean
}

/**
 * What the popup's one meeting card shows: the Meet tab the user is in, otherwise the next calendar event,
 * plus how many other meetings are left today.
 */
export const PopupMeetingStatus = {
  LOADING: "loading",
  LIVE: "live",
  NEXT: "next",
  EMPTY: "empty",
  NOT_CONNECTED: "not-connected",
} as const
export type PopupMeetingStatus = (typeof PopupMeetingStatus)[keyof typeof PopupMeetingStatus]

interface PopupMeeting {
  status: PopupMeetingStatus
  live?: LiveMeeting
  next?: NextMeeting
  leftToday: number
}

const findLiveMeeting = async (): Promise<LiveMeeting | undefined> => {
  const tabs = await chrome.tabs.query({ url: "https://meet.google.com/*" })
  const tab = tabs.find((t) => t.url && MEET_ROOM_PATH.test(new URL(t.url).pathname))
  if (!tab?.id) return undefined
  const title = (tab.title ?? "").replace(/\s*[-–]\s*Google Meet\s*$/, "").trim()
  return { tabId: tab.id, windowId: tab.windowId, title }
}

export const usePopupMeeting = (): PopupMeeting => {
  const [meeting, setMeeting] = useState<PopupMeeting>({ status: PopupMeetingStatus.LOADING, leftToday: 0 })

  useEffect(() => {
    const load = async () => {
      const [live, stored] = await Promise.all([
        findLiveMeeting(),
        chrome.storage.local.get(["calendarConnected", "calendarEvents"]),
      ])
      const now = dayjs()
      const upcoming = (Array.isArray(stored.calendarEvents) ? (stored.calendarEvents as CalendarEvent[]) : [])
        .map((evt) => ({
          evt,
          start: evt.start.dateTime ? dayjs(evt.start.dateTime) : dayjs(evt.start.date),
          end: evt.end.dateTime ? dayjs(evt.end.dateTime) : dayjs(evt.end.date),
        }))
        .filter(({ end }) => end.isAfter(now))
        .sort((a, b) => a.start.valueOf() - b.start.valueOf())

      // Meetings still to come today, not counting the one on the card
      const laterToday = (skipFirst: boolean) =>
        upcoming.slice(skipFirst ? 1 : 0).filter(({ start }) => start.isAfter(now) && start.isSame(now, "day")).length

      if (live) {
        setMeeting({ status: PopupMeetingStatus.LIVE, live, leftToday: laterToday(false) })
        return
      }
      if (!stored.calendarConnected) {
        setMeeting({ status: PopupMeetingStatus.NOT_CONNECTED, leftToday: 0 })
        return
      }
      const first = upcoming[0]
      if (!first) {
        setMeeting({ status: PopupMeetingStatus.EMPTY, leftToday: 0 })
        return
      }
      setMeeting({
        status: PopupMeetingStatus.NEXT,
        next: {
          ...first,
          joinUrl: first.evt.conferenceData?.entryPoints?.find((e) => e.entryPointType === "video")?.uri,
          minsUntil: first.start.diff(now, "minute"),
          isOngoing: first.start.isBefore(now),
        },
        leftToday: laterToday(true),
      })
    }
    load()
  }, [])

  return meeting
}
