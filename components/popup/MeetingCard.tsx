import React, { useEffect, useState } from "react"
import { CalendarOutlined, LoadingOutlined, LayoutOutlined, RightOutlined, TeamOutlined } from "@ant-design/icons"
import googleMeetIcon from "~images/google-meet-logo-main-icon.png"
import useI18n from "~/utils/i18n"
import { getConfigValue } from "~/utils/appConfig"
import { getLanguageByCode } from "~/utils/languages"
import openSidePanel from "~utils/open-side-panel"
import { OptionsRoute, openOptions } from "~/utils/options-routes"
import { PopupMeetingStatus, usePopupMeeting, type LiveMeeting } from "~/hooks/usePopupMeeting"

const GOOGLE_CALENDAR_URL = {
  TODAY: "https://calendar.google.com/calendar/r/day",
  AGENDA: "https://calendar.google.com/calendar/r/agenda",
} as const

const openCalendarWeb = (url: string) => {
  chrome.tabs.create({ url })
  window.close()
}

/** Opens an extension page from the popup and gets the popup out of the way. */
const openAndClose = (route: Parameters<typeof openOptions>[0]) => {
  openOptions(route)
  window.close()
}

const LiveCard: React.FC<{ live: LiveMeeting }> = ({ live }) => {
  const { t } = useI18n()
  const [translateInto, setTranslateInto] = useState("")

  useEffect(() => {
    Promise.all([getConfigValue("autoTranslateEnabled"), getConfigValue("translationLanguage")]).then(
      ([enabled, code]) => setTranslateInto(enabled && code ? getLanguageByCode(code as string).nativeName : "")
    )
  }, [])

  const openPanel = async () => {
    try {
      await openSidePanel()
    } finally {
      window.close()
    }
  }

  const backToMeeting = async () => {
    await chrome.tabs.update(live.tabId, { active: true })
    await chrome.windows.update(live.windowId, { focused: true })
    window.close()
  }

  return (
    <div className="pm-card pm-card--live">
      <div className="pm-card__top">
        <span className="pm-badge pm-badge--live">
          <span className="pm-badge__dot" />
          {t("meetings_in_progress")}
        </span>
      </div>
      <div className="pm-card__title">{live.title || t("meetings_untitled")}</div>
      {translateInto && <div className="pm-card__meta">{t("live_translation_active", { lang: translateInto })}</div>}
      <div className="pm-card__actions">
        <button className="pm-btn pm-btn--primary" onClick={openPanel}>
          <LayoutOutlined /> {t("popup_open_sidepanel")}
        </button>
        <button className="pm-btn" onClick={backToMeeting}>
          {t("popup_back_to_meeting")}
        </button>
      </div>
    </div>
  )
}

/** The one meeting the popup is about: the one the user is in, otherwise the next one on the calendar. */
const MeetingCard: React.FC = () => {
  const { t } = useI18n()
  const { status, live, next, leftToday } = usePopupMeeting()

  if (status === PopupMeetingStatus.LOADING) {
    return (
      <div className="pm-loading">
        <LoadingOutlined spin />
      </div>
    )
  }

  // What is left of today, or, when nothing is, a way to see what comes after
  const calendarLink =
    leftToday > 0 ? (
      <button className="pm-more" onClick={() => openCalendarWeb(GOOGLE_CALENDAR_URL.TODAY)}>
        <span>{t("popup_left_today", { n: String(leftToday) })}</span>
        <span>
          {t("popup_view")} <RightOutlined />
        </span>
      </button>
    ) : status === PopupMeetingStatus.NEXT ? (
      <button className="pm-more" onClick={() => openCalendarWeb(GOOGLE_CALENDAR_URL.AGENDA)}>
        <span>{t("popup_none_left_today")}</span>
        <span>
          {t("popup_view_upcoming")} <RightOutlined />
        </span>
      </button>
    ) : null

  if (status === PopupMeetingStatus.LIVE && live) {
    return (
      <section className="pm-section">
        <LiveCard live={live} />
        {calendarLink}
      </section>
    )
  }

  if (status === PopupMeetingStatus.NEXT && next) {
    const attendees = next.evt.attendees?.length ?? 0
    return (
      <section className="pm-section">
        <div className="pm-card">
          <div className="pm-card__top">
            {next.isOngoing ? (
              <span className="pm-badge pm-badge--live">{t("meetings_in_progress")}</span>
            ) : next.minsUntil <= 30 ? (
              <span className="pm-badge pm-badge--soon">{t("meetings_starts_in", { min: String(next.minsUntil) })}</span>
            ) : (
              <span className="pm-badge">{next.start.format("ddd")}</span>
            )}
            <span className="pm-card__time">
              {next.start.format("h:mm")} – {next.end.format("h:mm A")}
            </span>
          </div>
          <div className="pm-card__title">{next.evt.summary || t("meetings_untitled")}</div>
          {(attendees > 0 || next.joinUrl) && (
            <div className="pm-card__footer">
              <span className="pm-card__meta">
                {attendees > 0 && (
                  <>
                    <TeamOutlined /> {t("meetings_participants", { n: String(attendees) })}
                  </>
                )}
              </span>
              {next.joinUrl && (
                <button className="pm-btn pm-btn--primary pm-btn--sm" onClick={() => chrome.tabs.create({ url: next.joinUrl })}>
                  <img src={googleMeetIcon} className="pm-btn__logo" alt="" />
                  {t("meetings_join_btn")}
                </button>
              )}
            </div>
          )}
        </div>
        {calendarLink}
      </section>
    )
  }

  const notConnected = status === PopupMeetingStatus.NOT_CONNECTED
  return (
    <section className="pm-section">
      <div className="pm-card pm-card--empty">
        <div className="pm-card__icon">
          <CalendarOutlined />
        </div>
        <div className="pm-card__title">{notConnected ? t("popup_connect_calendar") : t("meetings_no_upcoming_title")}</div>
        <div className="pm-card__meta">{notConnected ? t("popup_connect_calendar_sub") : t("meetings_no_upcoming_sub")}</div>
        {notConnected && (
          <div className="pm-card__actions pm-card__actions--center">
            <button className="pm-btn pm-btn--primary pm-btn--sm" onClick={() => openAndClose(OptionsRoute.CALENDAR)}>
              {t("meetings_open_calendar_settings")}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

export default MeetingCard
