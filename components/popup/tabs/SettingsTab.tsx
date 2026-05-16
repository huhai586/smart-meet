import React, { useEffect, useState } from "react"
import {
  RobotOutlined,
  TranslationOutlined,
  CalendarOutlined,
  CloudOutlined,
  DatabaseOutlined,
  RightOutlined,
  ExportOutlined,
} from "@ant-design/icons"
import useI18n from "~/utils/i18n"
import { getConfigValue } from "~/utils/appConfig"
import { getAllAIServiceConfigs } from "~/utils/getAI"
import GoogleCalendarService from "~/utils/google-calendar-service"
import { StorageFactory } from "~/background/data-persistence/storage-factory"

const openOptionsAt = (route: string) => {
  const url = chrome.runtime.getURL("options.html") + "#" + route
  chrome.tabs.create({ url })
  window.close()
}

// Map provider IDs to short display names
const PROVIDER_NAMES: Record<string, string> = {
  "google-gemini": "Gemini",
  gemini: "Gemini",
  openai: "OpenAI",
  "gpt-4": "OpenAI",
  deepseek: "DeepSeek",
  anthropic: "Claude",
  claude: "Claude",
  groq: "Groq",
  xai: "Grok",
  ollama: "Ollama",
  "local-llm": "Local LLM",
}

const TRANSLATION_NAMES: Record<string, string> = {
  google: "Google",
  deepl: "DeepL",
  openai: "OpenAI",
  gemini: "Gemini",
  local: "Local",
  local_translator: "Local",
  "local-translator": "Local",
}

interface SettingsState {
  aiProvider: string
  aiModel: string
  translationProvider: string
  calendarConnected: boolean
  driveConnected: boolean
  localDataDays: number
}

const SettingsTab: React.FC = () => {
  const { t } = useI18n()
  const [state, setState] = useState<SettingsState>({
    aiProvider: "",
    aiModel: "",
    translationProvider: "",
    calendarConnected: false,
    driveConnected: false,
    localDataDays: 0,
  })

  useEffect(() => {
    const load = async () => {
      // AI config
      const [aisConfig, translationProvider] = await Promise.all([
        getAllAIServiceConfigs(),
        getConfigValue("translationProvider") as Promise<string>,
      ])

      const activeService = aisConfig.data.find(d => d.aiName === aisConfig.active)
      const aiProvider = PROVIDER_NAMES[aisConfig.active] ?? aisConfig.active ?? "—"
      const aiModel = activeService?.modelName ?? ""

      // Calendar connection
      const calService = GoogleCalendarService.getInstance()
      const calState = await calService.getPersistedState()

      // Drive connection (non-interactive token check)
      const driveConnected = await new Promise<boolean>((resolve) => {
        if (!chrome.identity?.getAuthToken) { resolve(false); return }
        chrome.identity.getAuthToken({ interactive: false }, (token) => {
          if (chrome.runtime.lastError || !token) { resolve(false); return }
          resolve(true)
        })
      })

      // Local data: count days with meeting records
      let localDataDays = 0
      try {
        const days = await StorageFactory.getInstance().getProvider().getDaysWithMessages()
        localDataDays = days.length
      } catch { /* ignore */ }

      setState({
        aiProvider,
        aiModel,
        translationProvider: TRANSLATION_NAMES[translationProvider as string] ?? (translationProvider as string) ?? "—",
        calendarConnected: calState.connected,
        driveConnected,
        localDataDays,
      })
    }
    load().catch(console.error)
  }, [])

  const rows = [
    {
      icon: <RobotOutlined />,
      iconBg: "#FF9500",
      label: t("tab_ai_models_nav"),
      value: state.aiModel
        ? `${state.aiProvider} · ${state.aiModel}`
        : state.aiProvider || "—",
      route: "ai-translation",
      badge: null,
    },
    {
      icon: <TranslationOutlined />,
      iconBg: "#34C759",
      label: t("tab_translation"),
      value: state.translationProvider || "—",
      route: "translation",
      badge: null,
    },
    {
      icon: <CalendarOutlined />,
      iconBg: "#FF3B30",
      label: t("tab_calendar"),
      value: "",
      route: "calendar",
      badge: state.calendarConnected,
    },
    {
      icon: <CloudOutlined />,
      iconBg: "#4285F4",
      label: t("tab_google_drive"),
      value: "",
      route: "cloud-sync",
      badge: state.driveConnected,
    },
    {
      icon: <DatabaseOutlined />,
      iconBg: "#30B0C7",
      label: t("settings_local_data") || "Local Data",
      value: state.localDataDays > 0
        ? (t("settings_local_days")?.replace("{n}", String(state.localDataDays)) || `${state.localDataDays} days`)
        : "—",
      route: "history",
      badge: null,
    },
  ]

  return (
    <div className="ph-settings">
      <div className="ph-settings__list">
        {rows.map((r) => (
          <div
            key={r.route + r.label}
            className="ph-settings__row"
            onClick={() => openOptionsAt(r.route)}
          >
            <div className="ph-settings__row-left">
              <div
                className="ph-settings__row-icon"
                style={{ background: r.iconBg }}
              >
                {r.icon}
              </div>
              <div className="ph-settings__row-label">{r.label}</div>
            </div>
            <div className="ph-settings__row-right">
              {r.badge !== null ? (
                r.badge ? (
                  <span className="ph-settings__badge ph-settings__badge--on">{t("settings_connected") || "Connected"}</span>
                ) : (
                  <span className="ph-settings__badge ph-settings__badge--off">{t("settings_not_connected") || "Off"}</span>
                )
              ) : (
                <span className="ph-settings__row-value">{r.value}</span>
              )}
              <RightOutlined className="ph-settings__chevron" />
            </div>
          </div>
        ))}
      </div>

      <button
        className="ph-settings__open-full"
        onClick={() => openOptionsAt("general")}
      >
        <span>{t("settings_open_full") || "Open Full Settings"}</span>
        <ExportOutlined />
      </button>
    </div>
  )
}

export default SettingsTab
