import React, { useEffect, useState } from "react"
import { LoadingOutlined, LayoutOutlined, RightOutlined, TeamOutlined } from "@ant-design/icons"
import googleMeetIcon from "~images/google-meet-logo-main-icon.png"
import useI18n from "~/utils/i18n"
import { getConfigValue } from "~/utils/appConfig"
import { getLanguageByCode } from "~/utils/languages"
import openSidePanel from "~utils/open-side-panel"
import { OptionsRoute, openOptions } from "~/utils/options-routes"
import { PopupMeetingStatus, usePopupMeeting, type LiveMeeting } from "~/hooks/usePopupMeeting"

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

  const leftTodayLink = leftToday > 0 && (
    <button className="pm-more" onClick={() => openAndClose(OptionsRoute.CALENDAR)}>
      <span>{t("popup_left_today", { n: String(leftToday) })}</span>
      <span>
        {t("popup_view")} <RightOutlined />
      </span>
    </button>
  )

  if (status === PopupMeetingStatus.LIVE && live) {
    return (
      <section className="pm-section">
        <LiveCard live={live} />
        {leftTodayLink}
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
          {attendees > 0 && (
            <div className="pm-card__meta">
              <TeamOutlined /> {t("meetings_participants", { n: String(attendees) })}
            </div>
          )}
          {next.joinUrl && (
            <div className="pm-card__actions">
              <button className="pm-btn pm-btn--primary" onClick={() => chrome.tabs.create({ url: next.joinUrl })}>
                <img src={googleMeetIcon} className="pm-btn__logo" alt="" />
                {t("meetings_join_btn")}
              </button>
            </div>
          )}
        </div>
        {leftTodayLink}
      </section>
    )
  }

  const notConnected = status === PopupMeetingStatus.NOT_CONNECTED
  return (
    <section className="pm-section">
      <div className="pm-card pm-card--empty">
        <div className="pm-card__title">{notConnected ? t("popup_connect_calendar_sub") : t("meetings_no_upcoming_title")}</div>
        {!notConnected && <div className="pm-card__meta">{t("meetings_no_upcoming_sub")}</div>}
        {notConnected && (
          <div className="pm-card__actions">
            <button className="pm-btn" onClick={() => openAndClose(OptionsRoute.CALENDAR)}>
              {t("popup_connect_calendar")}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

export default MeetingCard
