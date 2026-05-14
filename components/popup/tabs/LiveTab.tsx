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
import type { LiveState } from "../types"

const LiveTab: React.FC = () => {
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
        <h3 className="ph-live-waiting__title">No live meeting detected</h3>
        <p className="ph-live-waiting__sub">
          Join a Google Meet meeting to see live captions and translation status.
        </p>
        <div className="ph-live-waiting__how">
          <div className="ph-live-waiting__how-title">
            <InfoCircleOutlined /> How it works
          </div>
          <p className="ph-live-waiting__how-body">
            We'll automatically detect when you're in a Google Meet and start
            capturing captions.
          </p>
        </div>
        <button
          className="ph-live-waiting__learn"
          onClick={() => chrome.runtime.openOptionsPage()}
        >
          Learn more <ExportOutlined />
        </button>
      </div>
    )
  }

  return (
    <div className="ph-live">
      <div className="ph-live__badge">
        <span className="ph-live__badge-dot" />
        Google Meet detected
      </div>

      <div className="ph-live__card">
        <div className="ph-live__card-header">
          <div className="ph-live__card-header-text">
            <div className="ph-live__card-title">{meetTitle}</div>
            <div className="ph-live__card-meta">
              <TeamOutlined />
              <span>{dayjs().format("h:mm A")} · Live now</span>
            </div>
          </div>
          <div className="ph-live__wave">
            <span /><span /><span /><span /><span />
          </div>
        </div>

        <div className="ph-live__status-card">
          <div className="ph-live__row">
            <div className="ph-live__row-left">
              <MessageOutlined />
              <span>Captions</span>
            </div>
            <span className="ph-badge ph-badge--green">Active</span>
          </div>
          <div className="ph-live__row">
            <div className="ph-live__row-left">
              <TranslationOutlined />
              <span>Translation</span>
            </div>
            {autoTranslate ? (
              <span className="ph-badge ph-badge--green">
                Active (EN → {translationLang})
              </span>
            ) : (
              <span className="ph-badge ph-badge--gray">Off</span>
            )}
          </div>
        </div>

        <button
          className="ph-btn ph-btn--primary ph-btn--full ph-live__cta"
          onClick={handleOpenPanel}
        >
          Open Live Panel <ExportOutlined />
        </button>
      </div>

      <p className="ph-live__hint">
        Captions and translation are running automatically.{" "}
        <span onClick={() => chrome.runtime.openOptionsPage()}>
          Manage in Settings ›
        </span>
      </p>
    </div>
  )
}

export default LiveTab
