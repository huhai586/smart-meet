import React, { useEffect, useState } from "react"
import dayjs from "dayjs"
import {
  LoadingOutlined,
  InfoCircleOutlined,
  TeamOutlined,
  TranslationOutlined,
  MessageOutlined,
  ExportOutlined,
} from "@ant-design/icons"
import liveEmptyBg from "~images/popup/live_empty_bg.png"
import { getConfigValue } from "~/utils/appConfig"
import { getLanguageByCode } from "~/utils/languages"
import openSidePanel from "~utils/open-side-panel"
import useI18n from "~/utils/i18n"
import type { LiveState } from "../types"

const LiveTab: React.FC = () => {
  const { t } = useI18n()
  const [state, setState] = useState<LiveState>("loading")
  const [meetTitle, setMeetTitle] = useState<string>("Meeting")
  const [translationLang, setTranslationLang] = useState<string>("中文")
  const [autoTranslate, setAutoTranslate] = useState<boolean>(false)

  useEffect(() => {
    const detect = async () => {
      const tabs = await chrome.tabs.query({ url: "*://meet.google.com/*" })
      if (tabs.length === 0) {
        setState("waiting")
        return
      }
      setState("active")
      const tab = tabs[0]
      const title = (tab.title ?? "")
        .replace(/\s*[-–]\s*Google Meet\s*$/, "")
        .trim()
      setMeetTitle(title || "Meeting")

      const [langCode, translateEnabled] = await Promise.all([
        getConfigValue("translationLanguage"),
        getConfigValue("autoTranslateEnabled"),
      ])
      if (langCode) {
        const lang = getLanguageByCode(langCode as string)
        if (lang) setTranslationLang(lang.nativeName)
      }
      setAutoTranslate(!!translateEnabled)
    }
    detect()
  }, [])

  const handleOpenPanel = async () => {
    try {
      await openSidePanel()
      window.close()
    } catch {
      window.close()
    }
  }

  if (state === "loading") {
    return (
      <div className="ph-loading">
        <LoadingOutlined spin />
      </div>
    )
  }

  if (state === "waiting") {
    return (
      <div className="ph-live-waiting">
        <img src={liveEmptyBg} className="ph-live-waiting__illus" alt="" />
        <h3 className="ph-live-waiting__title">{t('live_no_meeting_title')}</h3>
        <p className="ph-live-waiting__sub">
          {t('live_no_meeting_sub')}
        </p>
        <div className="ph-live-waiting__how">
          <div className="ph-live-waiting__how-title">
            <InfoCircleOutlined /> {t('live_how_it_works')}
          </div>
          <p className="ph-live-waiting__how-body">
            {t('live_how_body')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="ph-live">
      <div className="ph-live__badge">
        <span className="ph-live__badge-dot" />
        {t('live_meet_detected')}
      </div>

      <div className="ph-live__card">
        <div className="ph-live__card-header">
          <div className="ph-live__card-header-text">
            <div className="ph-live__card-title">{meetTitle}</div>
            <div className="ph-live__card-meta">
              <TeamOutlined />
              <span>{dayjs().format("h:mm A")} · {t('live_now')}</span>
            </div>
          </div>
          <div className="ph-live__wave">
            <span /><span /><span /><span /><span />
          </div>
        </div>

        <div className="ph-live__status-card">
          <div className="ph-live__row">
            <div className="ph-live__row-left">
              <TranslationOutlined />
              <span>{t('live_translation_label')}</span>
            </div>
            {autoTranslate ? (
              <span className="ph-badge ph-badge--green">
                {t('live_translation_active', { lang: translationLang })}
              </span>
            ) : (
              <span className="ph-badge ph-badge--gray">{t('live_off')}</span>
            )}
          </div>
        </div>

        <button
          className="ph-btn ph-btn--primary ph-btn--full ph-live__cta"
          onClick={handleOpenPanel}
        >
          {t('live_open_panel_btn')} <ExportOutlined />
        </button>
      </div>

      <p className="ph-live__hint">
        <span onClick={() => {
          const url = chrome.runtime.getURL("options.html") + "#translation"
          chrome.tabs.create({ url })
          window.close()
        }}>
          {t('live_hint')}
        </span>
      </p>
    </div>
  )
}

export default LiveTab
