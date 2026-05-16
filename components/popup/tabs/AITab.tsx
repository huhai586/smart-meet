import React, { useEffect, useRef, useState } from "react"
import dayjs from "dayjs"
import {
  FileTextOutlined,
  BulbOutlined,
  MessageOutlined,
  RightOutlined,
} from "@ant-design/icons"
import aiEmptyBg from "~images/popup/ai_empty_bg.png"
import openSidePanel from "~utils/open-side-panel"
import useI18n from "~/utils/i18n"
import type { MeetingGroup } from "../types"

const AITab: React.FC = () => {
  const { t } = useI18n()
  const [meetings, setMeetings] = useState<MeetingGroup[]>([])
  const loadRef = useRef<() => void>()

  useEffect(() => {
    const load = async () => {
      const all: MeetingGroup[] = []
      for (let i = 0; i < 7; i++) {
        const date = dayjs().subtract(i, "day").toISOString()
        try {
          const transcripts = await new Promise<any[]>((resolve) => {
            try {
              chrome.runtime.sendMessage({ action: "get-transcripts", date }, (res) => {
                void chrome.runtime.lastError
                resolve(Array.isArray(res) ? res : [])
              })
            } catch {
              resolve([])
            }
          })
          if (transcripts.length === 0) continue

          const groups = new Map<string, { times: number[] }>()
          transcripts.forEach((t) => {
            const key = t.meetingName || t.session || "Meeting"
            if (!groups.has(key)) groups.set(key, { times: [] })
            groups.get(key)!.times.push(t.timestamp)
          })

          groups.forEach(({ times }, key) => {
            const minTs = Math.min(...times)
            const maxTs = Math.max(...times)
            const dur = Math.max(1, Math.round((maxTs - minTs) / 60_000))
            const label =
              i === 0
                ? `Today, ${dayjs(minTs).format("h:mm A")}`
                : i === 1
                ? `Yesterday, ${dayjs(minTs).format("h:mm A")}`
                : dayjs(minTs).format("MMM D")
            all.push({
              title: key.replace(/\s*[-–]\s*Google Meet\s*$/, "").trim(),
              dateLabel: label,
              duration: dur,
              session: key,              dateTs: dayjs().subtract(i, "day").startOf("day").valueOf(),            })
          })
        } catch {
          // skip day on error
        }
      }
      setMeetings(all.length > 0 ? all.slice(0, 6) : [])
    }
    loadRef.current = load
    load()
  }, [])

  // Reload when any day's records are deleted
  useEffect(() => {
    const handler = (msg: { action: string }) => {
      if (msg.action === 'records-deleted') loadRef.current?.()
    }
    chrome.runtime.onMessage.addListener(handler)
    return () => chrome.runtime.onMessage.removeListener(handler)
  }, [])

  const openHistory = () => {
    const url = chrome.runtime.getURL("options.html") + "#history"
    chrome.tabs.create({ url })
    window.close()
  }

  const handleAskAI = async (m: MeetingGroup) => {
    chrome.storage.local.set({
      sidepanelPendingNav: { tab: "summary", date: m.dateTs },
    })
    chrome.runtime.sendMessage({ action: "open-summary", date: m.dateTs })
    try { await openSidePanel() } catch { /* ignore */ }
    window.close()
  }

  if (meetings.length === 0) {
    return (
      <div className="ph-ai-empty">
        <img src={aiEmptyBg} className="ph-ai-empty__illus" alt="" />
        <h3 className="ph-ai-empty__title">{t('ai_no_content_title')}</h3>
        <p className="ph-ai-empty__sub">{t('ai_no_content_sub')}</p>
        <div className="ph-ai-empty__features">
          <div className="ph-ai-empty__features-label">{t('ai_whats_coming')}</div>
          {[
            { icon: <FileTextOutlined />, text: t('ai_feature_summaries') },
            { icon: <BulbOutlined />, text: t('ai_feature_highlights') },
            { icon: <MessageOutlined />, text: t('ai_feature_ask_meetings') },
          ].map((f, i) => (
            <div key={i} className="ph-ai-empty__feature-item">
              <span className="ph-ai-empty__feature-icon">{f.icon}</span>
              <span>{f.text}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="ph-ai">
      <div className="ph-section-label">{t('ai_recent_meetings')}</div>
      <div className="ph-ai__list">
        {meetings.map((m, i) => (
          <div key={i} className="ph-ai__item">
            <div className="ph-ai__item-icon">
              <FileTextOutlined />
            </div>
            <div className="ph-ai__item-body">
              <div className="ph-ai__item-title">{m.title}</div>
              <div className="ph-ai__item-meta">
                {m.dateLabel} · {m.duration} min
              </div>
            </div>
            <button
              className="ph-btn-sm"
              onClick={() => handleAskAI(m)}
            >
              {t('ai_ask_ai_btn')}
            </button>
          </div>
        ))}
      </div>
      <button
        className="ph-all-meetings"
        onClick={openHistory}
      >
        {t('ai_view_all_meetings')} <RightOutlined />
      </button>
    </div>
  )
}

export default AITab
