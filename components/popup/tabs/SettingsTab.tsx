import React, { useEffect, useState } from "react"
import {
  CalendarOutlined,
  GlobalOutlined,
  ThunderboltOutlined,
  BellOutlined,
  RightOutlined,
  ExportOutlined,
} from "@ant-design/icons"
import { getConfigValue } from "~/utils/appConfig"
import { getLanguageByCode } from "~/utils/languages"
import { getProviderDisplayName, type TranslationProvider } from "~/hooks/useTranslationProvider"

const SettingsTab: React.FC = () => {
  const [calendarConnected, setCalendarConnected] = useState(false)
  const [langLabel, setLangLabel] = useState("EN → 中文")
  const [providerLabel, setProviderLabel] = useState("Microsoft Translator")

  useEffect(() => {
    chrome.storage.local.get(["calendarConnected"], (res) =>
      setCalendarConnected(!!res.calendarConnected)
    )
    getConfigValue("translationLanguage").then((code) => {
      if (code) {
        const l = getLanguageByCode(code as string)
        if (l) setLangLabel(`EN → ${l.nativeName}`)
      }
    })
    getConfigValue("translationProvider").then((p) => {
      setProviderLabel(
        getProviderDisplayName((p as TranslationProvider) ?? "microsoft")
      )
    })
  }, [])

  const openSettings = () => chrome.runtime.openOptionsPage()

  const rows = [
    {
      icon: <CalendarOutlined />,
      label: "Google Calendar",
      value: calendarConnected ? "Connected" : "Not connected",
      valueClass: calendarConnected ? "connected" : "not-connected",
    },
    {
      icon: <GlobalOutlined />,
      label: "Language",
      value: `Translation: ${langLabel}`,
      valueClass: "",
    },
    {
      icon: <ThunderboltOutlined />,
      label: "AI Provider",
      value: providerLabel,
      valueClass: "",
    },
    {
      icon: <BellOutlined />,
      label: "Notifications",
      value: "5 minutes before",
      valueClass: "",
    },
  ]

  return (
    <div className="ph-settings">
      <div className="ph-settings__list">
        {rows.map((r, i) => (
          <div key={i} className="ph-settings__row" onClick={openSettings}>
            <div className="ph-settings__row-left">
              <div className="ph-settings__row-icon">{r.icon}</div>
              <div>
                <div className="ph-settings__row-label">{r.label}</div>
                <div className={`ph-settings__row-value ${r.valueClass}`}>
                  {r.value}
                </div>
              </div>
            </div>
            <RightOutlined className="ph-settings__chevron" />
          </div>
        ))}
      </div>

      <button
        className="ph-btn ph-btn--secondary ph-btn--full"
        onClick={openSettings}
      >
        Open full settings <ExportOutlined />
      </button>
      <p className="ph-settings__hint">Advanced settings, API keys, and more</p>
    </div>
  )
}

export default SettingsTab
