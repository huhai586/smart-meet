import React from "react"
import {
  CalendarOutlined,
  AudioOutlined,
  SettingOutlined,
} from "@ant-design/icons"
import type { Tab } from "./types"

// Sparkle icon for AI tab (matches design)
const SparkleIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2 L13.5 9.5 L21 11 L13.5 12.5 L12 20 L10.5 12.5 L3 11 L10.5 9.5 Z" />
    <path d="M19 2 L19.8 5.2 L23 6 L19.8 6.8 L19 10 L18.2 6.8 L15 6 L18.2 5.2 Z" opacity="0.7" />
  </svg>
)

interface TabBarProps {
  active: Tab
  onChange: (t: Tab) => void
}

const TABS: { key: Tab; icon: React.ReactNode; title: string }[] = [
  { key: "meetings", icon: <CalendarOutlined />, title: "Meetings" },
  { key: "live",     icon: <AudioOutlined />,    title: "Live" },
  { key: "ai",       icon: <SparkleIcon />,       title: "AI" },
  { key: "settings", icon: <SettingOutlined />,   title: "Settings" },
]

const TabBar: React.FC<TabBarProps> = ({ active, onChange }) => {
  return (
    <div className="ph-tabs">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          className={`ph-tabs__tab${active === tab.key ? " active" : ""}`}
          onClick={() => onChange(tab.key)}
          title={tab.title}
        >
          {tab.icon}
        </button>
      ))}
    </div>
  )
}

export default TabBar
