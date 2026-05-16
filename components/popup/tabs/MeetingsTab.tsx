import React, { useEffect, useState } from "react"
import dayjs from "dayjs"
import {
  LoadingOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  FileTextOutlined,
  RightOutlined,
} from "@ant-design/icons"
import googleMeetIcon from "~images/google-meet-logo-main-icon.png"
import meetingEmptyBg from "~images/popup/meeting_empty_bg.png"
import useI18n from "~/utils/i18n"
import type { CalendarEvent } from "../types"

const MeetingsTab: React.FC = () => {
  const { t } = useI18n()
  const [connected, setConnected] = useState<boolean | null>(null)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null)

  useEffect(() => {
    chrome.storage.local.get(["calendarConnected", "calendarEvents", "calendarLastSync"], (res) => {
      setConnected(!!res.calendarConnected)
      setEvents(
        Array.isArray(res.calendarEvents) ? res.calendarEvents.slice(0, 6) : []
      )
      setLastSyncAt(res.calendarLastSync ?? null)
    })
  }, [])

  /** Format elapsed seconds into "Xh Ym Zs", skipping leading-zero units */
  const formatElapsed = (totalSeconds: number): string => {
    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    const s = totalSeconds % 60
    const parts: string[] = []
    if (h > 0) parts.push(`${h}${t('meetings_sync_h')}`)
    if (h > 0 || m > 0) parts.push(`${m}${t('meetings_sync_m')}`)
    parts.push(`${s}${t('meetings_sync_s')}`)
    return parts.join(' ')
  }

  const syncLabel = (() => {
    if (!lastSyncAt) return t('meetings_synced_now')
    const diffSec = Math.floor((Date.now() - new Date(lastSyncAt).getTime()) / 1000)
    if (diffSec < 5) return t('meetings_synced_now')
    return (t('meetings_sync_ago') || 'Synced {time} ago').replace('{time}', formatElapsed(diffSec))
  })()

  const openCalendarOptions = () => {
    const url = chrome.runtime.getURL("options.html") + "#calendar"
    chrome.tabs.create({ url })
    window.close()
  }

  if (connected === null) {
    return (
      <div className="ph-loading">
        <LoadingOutlined spin />
      </div>
    )
  }

  if (!connected) {
    return (
      <div className="ph-meetings-connect">
        <img src={meetingEmptyBg} className="ph-meetings-connect__illus" alt="" />
        <h2 className="ph-meetings-connect__title">
          See your upcoming Google Meet meetings
        </h2>
        <p className="ph-meetings-connect__sub">
          Connect your Google Calendar to view upcoming meetings and get reminders.
        </p>
        <button
          className="ph-btn ph-btn--primary ph-btn--full"
          onClick={openCalendarOptions}
        >
          <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
            <path fill="#fff" d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z"/>
          </svg>
          <span>Connect Google Calendar</span>
        </button>
        <div className="ph-meetings-connect__note">
          🔒 Read-only access. Your data is private.{" "}
        </div>
      </div>
    )
  }

  const now = dayjs()
  const upcoming = events
    .map((e) => ({
      evt: e,
      start: e.start.dateTime ? dayjs(e.start.dateTime) : dayjs(e.start.date),
      end: e.end.dateTime ? dayjs(e.end.dateTime) : dayjs(e.end.date),
    }))
    .filter(({ end }) => end.isAfter(now))
    .sort((a, b) => a.start.valueOf() - b.start.valueOf())

  if (upcoming.length === 0) {
    return (
      <div className="ph-meetings-connect">
        <img src={meetingEmptyBg} className="ph-meetings-connect__illus" alt="" />
        <h2 className="ph-meetings-connect__title">{t('meetings_no_upcoming_title')}</h2>
        <p className="ph-meetings-connect__sub">
          {t('meetings_no_upcoming_sub')}
        </p>
        <button
          className="ph-btn ph-btn--secondary ph-btn--full"
          onClick={openCalendarOptions}
        >
          {t('meetings_open_calendar_settings')}
        </button>
      </div>
    )
  }

  const featured = upcoming[0]
  const featuredMeetLink = featured.evt.conferenceData?.entryPoints?.find(
    (e) => e.entryPointType === "video"
  )?.uri
  const minsUntil = featured.start.diff(now, "minute")
  const isStartingSoon = minsUntil >= 0 && minsUntil <= 30
  const isOngoing = featured.start.isBefore(now) && featured.end.isAfter(now)
  const laterEvents = upcoming.slice(1).filter(({ start }) => start.isSame(now, "day"))

  return (
    <div className="ph-meetings-list">
      <div className="ph-meetings-date-row">
        <span className="ph-meetings-date-row__label">
          {t('meetings_today_label', { date: now.format("MMM D, YYYY") })}
        </span>
        <span className="ph-meetings-date-row__sync">
          <CheckCircleOutlined /> {syncLabel}
        </span>
      </div>

      <div className="ph-meeting-featured">
        <div className="ph-meeting-featured__top">
          {isOngoing ? (
            <span className="ph-chip ph-chip--green">{t('meetings_in_progress')}</span>
          ) : isStartingSoon ? (
            <span className="ph-chip ph-chip--orange">{t('meetings_starts_in', { min: String(minsUntil) })}</span>
          ) : (
            <span className="ph-chip ph-chip--gray">{featured.start.format("ddd")}</span>
          )}
          <span className="ph-meeting-featured__time">
            {featured.start.format("h:mm")} – {featured.end.format("h:mm A")}
          </span>
        </div>
        <div className="ph-meeting-featured__title">
          {featured.evt.summary || t('meetings_untitled')}
        </div>
        {featured.evt.attendees && featured.evt.attendees.length > 0 && (
          <div className="ph-meeting-featured__attendees">
            <TeamOutlined /> {t('meetings_participants', { n: String(featured.evt.attendees.length) })}
          </div>
        )}
        {featuredMeetLink && (
          <button
            className="ph-btn ph-btn--primary ph-btn--full ph-meeting-featured__join"
            onClick={() => chrome.tabs.create({ url: featuredMeetLink })}
          >
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 28,
              height: 28,
              borderRadius: 7,
              background: "#fff",
              flexShrink: 0,
            }}>
              <img src={googleMeetIcon} style={{ width: 18, height: 18, objectFit: "contain" }} alt="" />
            </span>
              {t('meetings_join_btn')}
          </button>
        )}
      </div>

      {laterEvents.length > 0 && (
        <>
          <div className="ph-section-label" style={{ marginTop: 16 }}>{t('meetings_later_today')}</div>
          <div className="ph-meeting-later">
            {laterEvents.slice(0, 3).map(({ evt, start, end }) => {
              const link = evt.conferenceData?.entryPoints?.find(
                (e) => e.entryPointType === "video"
              )?.uri
              return (
                <div
                  key={evt.id}
                  className="ph-meeting-later__item"
                  onClick={() => link && chrome.tabs.create({ url: link })}
                >
                  <div className="ph-meeting-later__icon">
                    <FileTextOutlined />
                  </div>
                  <div className="ph-meeting-later__body">
                    <div className="ph-meeting-later__title">
                      {evt.summary || t('meetings_untitled')}
                    </div>
                    <div className="ph-meeting-later__meta">
                      {start.format("h:mm A")} – {end.format("h:mm A")}
                      {evt.attendees && evt.attendees.length > 0 && (
                        <span style={{ marginLeft: 8 }}>
                          <TeamOutlined /> {evt.attendees.length}
                        </span>
                      )}
                    </div>
                  </div>
                  <RightOutlined className="ph-meeting-later__chevron" />
                </div>
              )
            })}
          </div>
        </>
      )}

      <button
        className="ph-meetings-schedule"
        onClick={() => chrome.tabs.create({ url: "https://calendar.google.com" })}
      >
        {t('meetings_view_schedule')} <RightOutlined />
      </button>
    </div>
  )
}

export default MeetingsTab
