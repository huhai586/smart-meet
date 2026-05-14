import React from "react"
import {
  CalendarOutlined,
  AudioOutlined,
  SettingOutlined,
  StarOutlined,
} from "@ant-design/icons"
import type { Tab } from "./types"

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "meetings", label: "Meetings", icon: <CalendarOutlined /> },
  { key: "live",     label: "Live",     icon: <AudioOutlined /> },
  { key: "ai",       label: "AI",       icon: <StarOutlined /> },
  { key: "settings", label: "Settings", icon: <SettingOutlined /> },
]

interface TabBarProps {
  active: Tab
  onChange: (t: Tab) => void
}

const TabBar: React.FC<TabBarProps> = ({ active, onChange }) => (
  <div className="ph-tabs">
    {TABS.map((t) => (
      <button
        key={t.key}
        className={`ph-tabs__tab${active === t.key ? " active" : ""}`}
        onClick={() => onChange(t.key)}
      >
        {t.icon}
        <span>{t.label}</span>
      </button>
    ))}
  </div>
)

export default TabBar
