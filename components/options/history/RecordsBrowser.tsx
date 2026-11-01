import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Popconfirm, Spin } from 'antd';
import { CloseCircleFilled, DeleteOutlined, LoadingOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { StorageFactory } from '~background/data-persistence/storage-factory';
import type { Transcript } from '~hooks/useTranscripts';
import { useI18n } from '~utils/i18n';
import './records-browser.scss';

interface RecordDay {
  date: string;
  messageCount: number;
  meetingNames: string[];
  matches: Match[];
}

interface Match {
  recordIndex: number;
  speaker: string;
  time: string;
  preview: string;
}

interface Month {
  key: string;
  days: RecordDay[];
}

const MAX_MATCHES_PER_DAY = 3;
const PREVIEW_CONTEXT = 20;

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** The meeting records, day by day: the days on the left, what was said on the selected day on the right. */
const RecordsBrowser: React.FC = () => {
  const { t, langCode } = useI18n();
  const [days, setDays] = useState<RecordDay[]>([]);
  const [records, setRecords] = useState<Map<string, Transcript[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [highlighted, setHighlighted] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [deleting, setDeleting] = useState(false);
  const detailRef = useRef<HTMLDivElement>(null);

  const fullDate = useCallback(
    (date: string) => new Date(date).toLocaleDateString(langCode, { month: 'long', day: 'numeric', weekday: 'long' }),
    [langCode]
  );
  const monthLabel = (key: string) => new Date(`${key}-01`).toLocaleDateString(langCode, { year: 'numeric', month: 'long' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const storage = StorageFactory.getInstance().getProvider();
      const dates = [...(await storage.getDaysWithMessages())].sort((a, b) => dayjs(b).valueOf() - dayjs(a).valueOf());
      const entries = await Promise.all(dates.map(async (date) => [date, await storage.getRecords(dayjs(date))] as const));
      const map = new Map<string, Transcript[]>(entries);
      setRecords(map);
      setDays(
        entries.map(([date, list]) => ({
          date,
          messageCount: list.length,
          meetingNames: Array.from(new Set(list.map((r) => r.meetingName).filter(Boolean))) as string[],
          matches: [],
        }))
      );
      setSelectedDate((current) => current ?? entries[0]?.[0] ?? null);
    } catch (error) {
      console.error('Failed to load the meeting records', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const removeDay = useCallback((date: string) => {
    setDays((prev) => prev.filter((day) => day.date !== date));
    setRecords((prev) => {
      const next = new Map(prev);
      next.delete(date);
      return next;
    });
    setSelectedDate((current) => {
      if (current !== date) return current;
      return null;
    });
  }, []);

  // Records deleted from elsewhere (another options tab, the side panel)
  useEffect(() => {
    const onMessage = (msg: { action: string; date?: string }) => {
      if (msg.action === 'records-deleted' && msg.date) removeDay(msg.date);
    };
    chrome.runtime.onMessage.addListener(onMessage);
    return () => chrome.runtime.onMessage.removeListener(onMessage);
  }, [removeDay]);

  const search = () => {
    const term = query.trim();
    if (!term) return clearSearch();
    setActiveQuery(term);
    setDays((prev) =>
      prev.map((day) => {
        const matches: Match[] = [];
        (records.get(day.date) ?? []).forEach((record, recordIndex) => {
          if (matches.length >= MAX_MATCHES_PER_DAY) return;
          const content = record.talkContent || '';
          const at = content.toLowerCase().indexOf(term.toLowerCase());
          if (at === -1) return;
          const start = Math.max(0, at - PREVIEW_CONTEXT);
          const end = Math.min(content.length, at + term.length + PREVIEW_CONTEXT);
          matches.push({
            recordIndex,
            speaker: record.activeSpeaker,
            time: dayjs(record.timestamp).format('HH:mm'),
            preview: `${start > 0 ? '…' : ''}${content.slice(start, end)}${end < content.length ? '…' : ''}`,
          });
        });
        return { ...day, matches };
      })
    );
  };

  const clearSearch = () => {
    setQuery('');
    setActiveQuery('');
    setHighlighted(null);
    setDays((prev) => prev.map((day) => ({ ...day, matches: [] })));
  };

  const open = (date: string, recordIndex?: number) => {
    setSelectedDate(date);
    setHighlighted(recordIndex ?? null);
  };

  const deleteDay = async (date: string) => {
    setDeleting(true);
    try {
      await new Promise<void>((resolve, reject) => {
        chrome.runtime.sendMessage({ action: 'delete-records', date }, (res) => {
          void chrome.runtime.lastError;
          res?.success ? resolve() : reject();
        });
      });
      removeDay(date);
    } catch (error) {
      console.error('Failed to delete the records', error);
    } finally {
      setDeleting(false);
    }
  };

  const visibleDays = useMemo(() => (activeQuery ? days.filter((day) => day.matches.length > 0) : days), [days, activeQuery]);

  // Months, newest first, each with its days
  const months = useMemo(() => {
    const groups: Month[] = [];
    visibleDays.forEach((day) => {
      const key = day.date.slice(0, 7);
      const group = groups.find((g) => g.key === key);
      if (group) group.days.push(day);
      else groups.push({ key, days: [day] });
    });
    return groups;
  }, [visibleDays]);

  // Nothing selected (first load, or the selected day was deleted): fall to the newest day still listed
  useEffect(() => {
    if (!selectedDate && visibleDays.length > 0) setSelectedDate(visibleDays[0].date);
  }, [selectedDate, visibleDays]);

  const dayRecords = selectedDate ? records.get(selectedDate) ?? [] : [];

  // The day's records, grouped by the meeting they belong to
  const meetings = useMemo(() => {
    const groups: { name: string; items: { record: Transcript; index: number }[] }[] = [];
    dayRecords.forEach((record, index) => {
      const name = record.meetingName || '';
      let group = groups.find((g) => g.name === name);
      if (!group) {
        group = { name, items: [] };
        groups.push(group);
      }
      group.items.push({ record, index });
    });
    return groups;
  }, [dayRecords]);

  useEffect(() => {
    if (highlighted === null) return;
    const timer = setTimeout(() => document.getElementById(`rb-line-${highlighted}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150);
    return () => clearTimeout(timer);
  }, [highlighted, selectedDate]);

  useEffect(() => {
    if (highlighted === null) detailRef.current?.scrollTo({ top: 0 });
  }, [selectedDate, highlighted]);

  const highlight = (text: string) => {
    if (!activeQuery) return text;
    return text.split(new RegExp(`(${escapeRegExp(activeQuery)})`, 'gi')).map((part, i) =>
      part.toLowerCase() === activeQuery.toLowerCase() ? <mark key={i}>{part}</mark> : part
    );
  };

  const countLabel = (n: number) => `${n} ${n === 1 ? t('message') : t('messages')}`;
  const timeRange = (items: { record: Transcript }[]) => {
    const times = items.map(({ record }) => dayjs(record.timestamp).valueOf());
    return `${dayjs(Math.min(...times)).format('HH:mm')}–${dayjs(Math.max(...times)).format('HH:mm')}`;
  };

  return (
    <div className="rb">
      <aside className="rb-list">
        <div className="rb-search">
          <SearchOutlined />
          <input
            value={query}
            placeholder={t('search_content')}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!e.target.value) clearSearch();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') search();
              if (e.key === 'Escape') clearSearch();
            }}
          />
          {query && <CloseCircleFilled onClick={clearSearch} />}
        </div>

        <div className="rb-scroll">
          {loading ? (
            <div className="rb-state">
              <Spin indicator={<LoadingOutlined spin />} />
              <span>{t('loading_history')}</span>
            </div>
          ) : months.length === 0 ? (
            <div className="rb-state">{activeQuery ? t('no_matching_content') : t('no_chat_history')}</div>
          ) : (
            months.map((month) => (
              <div key={month.key} className="rb-month">
                <div className="rb-month__label">{monthLabel(month.key)}</div>
                {month.days.map((day) => (
                  <React.Fragment key={day.date}>
                    <button className={`rb-day${day.date === selectedDate ? ' is-selected' : ''}`} onClick={() => open(day.date)}>
                      <span className="rb-day__text">
                        <span className="rb-day__title">{fullDate(day.date)}</span>
                        <span className="rb-day__meetings">{day.meetingNames.join(' · ') || t('meetings_untitled')}</span>
                      </span>
                      <span className="rb-day__count">{day.messageCount}</span>
                    </button>
                    {day.matches.map((match) => (
                      <button key={match.recordIndex} className="rb-match" onClick={() => open(day.date, match.recordIndex)}>
                        <span className="rb-match__who">{match.speaker} · {match.time}</span>
                        <span className="rb-match__text">{highlight(match.preview)}</span>
                      </button>
                    ))}
                  </React.Fragment>
                ))}
              </div>
            ))
          )}
        </div>
      </aside>

      <section className="rb-detail">
        {selectedDate && dayRecords.length > 0 ? (
          <>
            <header className="rb-detail__head">
              <div>
                <h2>{fullDate(selectedDate)}</h2>
                <p>{countLabel(dayRecords.length)}</p>
              </div>
              <Popconfirm
                title={t('delete_day_records')}
                description={t('delete_day_records_confirm')}
                onConfirm={() => deleteDay(selectedDate)}
                okText={t('yes')}
                cancelText={t('cancel')}
                okButtonProps={{ danger: true }}
                placement="bottomRight"
              >
                <button className="rb-delete" disabled={deleting} title={t('delete_day_records')}>
                  <DeleteOutlined /> {t('delete_day_records')}
                </button>
              </Popconfirm>
            </header>

            <div className="rb-detail__body" ref={detailRef}>
              {meetings.map((meeting) => (
                <div key={meeting.name || 'untitled'} className="rb-meeting">
                  <div className="rb-meeting__head">
                    <h3>{meeting.name || t('meetings_untitled')}</h3>
                    <span>{timeRange(meeting.items)} · {countLabel(meeting.items.length)}</span>
                  </div>
                  {meeting.items.map(({ record, index }) => (
                    <div key={index} id={`rb-line-${index}`} className={`rb-line${highlighted === index ? ' is-highlighted' : ''}`}>
                      <span className="rb-line__time">{dayjs(record.timestamp).format('HH:mm:ss')}</span>
                      <div className="rb-line__body">
                        <span className="rb-line__speaker">{record.activeSpeaker}</span>
                        <p>{highlight(record.talkContent || '')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="rb-state rb-state--detail">{loading ? null : t('no_records_for_date')}</div>
        )}
      </section>
    </div>
  );
};

export default RecordsBrowser;
