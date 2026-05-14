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
import type { CalendarEvent } from "../types"

const MeetingsTab: React.FC = () => {
  const [connected, setConnected] = useState<boolean | null>(null)
  const [events, setEvents] = useState<CalendarEvent[]>([])

  useEffect(() => {
    chrome.storage.local.get(["calendarConnected", "calendarEvents"], (res) => {
      setConnected(!!res.calendarConnected)
      setEvents(
        Array.isArray(res.calendarEvents) ? res.calendarEvents.slice(0, 6) : []
      )
    })
  }, [])

  const openSettings = () => chrome.runtime.openOptionsPage()

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
          onClick={openSettings}
        >
          <span>Connect Google Calendar</span>
        </button>
        <div className="ph-meetings-connect__note">
          🔒 Read-only access. Your data is private.{" "}
          <span onClick={openSettings}>Learn more</span>
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
        <h2 className="ph-meetings-connect__title">No upcoming meetings</h2>
        <p className="ph-meetings-connect__sub">
          Your calendar is clear. Enjoy your day!
        </p>
        <button
          className="ph-btn ph-btn--secondary ph-btn--full"
          onClick={openSettings}
        >
          Open Calendar Settings
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
  const laterEvents = upcoming.slice(1)

  return (
    <div className="ph-meetings-list">
      <div className="ph-meetings-date-row">
        <span className="ph-meetings-date-row__label">
          Today · {now.format("MMM D, YYYY")}
        </span>
        <span className="ph-meetings-date-row__sync">
          <CheckCircleOutlined /> Synced just now
        </span>
      </div>

      <div className="ph-meeting-featured">
        <div className="ph-meeting-featured__top">
          {isOngoing ? (
            <span className="ph-chip ph-chip--green">● In progress</span>
          ) : isStartingSoon ? (
            <span className="ph-chip ph-chip--orange">Starts in {minsUntil} min</span>
          ) : (
            <span className="ph-chip ph-chip--gray">{featured.start.format("ddd")}</span>
          )}
          <span className="ph-meeting-featured__time">
            {featured.start.format("h:mm")} – {featured.end.format("h:mm A")}
          </span>
        </div>
        <div className="ph-meeting-featured__title">
          {featured.evt.summary || "Untitled Meeting"}
        </div>
        {featured.evt.attendees && featured.evt.attendees.length > 0 && (
          <div className="ph-meeting-featured__attendees">
            <TeamOutlined /> {featured.evt.attendees.length} participants
          </div>
        )}
        {featuredMeetLink && (
          <button
            className="ph-btn ph-btn--primary ph-btn--full ph-meeting-featured__join"
            onClick={() => chrome.tabs.create({ url: featuredMeetLink })}
          >
            <img
              src={googleMeetIcon}
              style={{ width: 18, height: 18, borderRadius: 4, objectFit: "contain" }}
              alt=""
            />
            Join Meeting
          </button>
        )}
      </div>

      {laterEvents.length > 0 && (
        <>
          <div className="ph-section-label" style={{ marginTop: 16 }}>Later today</div>
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
                      {evt.summary || "Untitled Meeting"}
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

      <div className="ph-meetings-footer">
        <CheckCircleOutlined className="ph-meetings-footer__icon" />
        <div>
          <div className="ph-meetings-footer__label">Google Calendar connected</div>
        </div>
        <span className="ph-meetings-footer__manage" onClick={openSettings}>
          Manage
        </span>
      </div>
    </div>
  )
}

export default MeetingsTab
