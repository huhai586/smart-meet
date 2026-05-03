import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Modal, Spin, Empty } from 'antd';
import { SearchOutlined, CloseCircleFilled, LoadingOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { StorageFactory } from '~background/data-persistence/storage-factory';
import type { Transcript } from '~hooks/useTranscripts';
import { useI18n } from '~utils/i18n';
import { setDayjsLocale } from '~utils/dayjs-config';
import './calendar-hig.scss';

interface ChatDay {
  date: string;
  formattedDate: string;
  dayOfWeek: string;
  dayFull: string;
  messageCount: number;
  matchedRecords?: MatchedRecord[];
}

interface MonthData {
  month: string;
  formattedMonth: string;
  days: ChatDay[];
  totalMessages: number;
}

interface MatchedRecord {
  transcript: Transcript;
  matchIndex: number;
  previewText: string;
  recordIndex: number;
}

const Calendar: React.FC = () => {
  const { t, langCode } = useI18n();
  const [monthsData, setMonthsData] = useState<MonthData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [chatRecords, setChatRecords] = useState<Transcript[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  const [searchFocused, setSearchFocused] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [contentSearchActive, setContentSearchActive] = useState(false);
  const [searchingContent, setSearchingContent] = useState(false);
  const [highlightedRecordIndex, setHighlightedRecordIndex] = useState<number | null>(null);

  const [allRecordsCache, setAllRecordsCache] = useState<Map<string, Transcript[]>>(new Map());

  const searchInputRef = useRef<HTMLInputElement>(null);
  const modalBodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setDayjsLocale(langCode); }, [langCode]);
  useEffect(() => { loadChatDays(); }, []);

  const loadChatDays = async () => {
    try {
      setLoading(true);
      const storage = StorageFactory.getInstance().getProvider();
      const datesWithMessages = await storage.getDaysWithMessages();
      if (datesWithMessages.length === 0) { setLoading(false); return; }

      const sortedDates = [...datesWithMessages].sort((a, b) =>
        dayjs(b).valueOf() - dayjs(a).valueOf()
      );

      const recordsCache = new Map<string, Transcript[]>();
      const counts = await Promise.all(
        sortedDates.map(async (dateStr) => {
          const records = await storage.getRecords(dayjs(dateStr));
          recordsCache.set(dateStr, records);
          return { dateStr, count: records.length };
        })
      );

      setAllRecordsCache(recordsCache);

      const monthsMap = new Map<string, ChatDay[]>();
      for (const { dateStr, count } of counts) {
        const d = dayjs(dateStr);
        const monthKey = d.format('YYYY-MM');
        const day: ChatDay = {
          date: dateStr,
          formattedDate: d.format('D'),
          dayOfWeek: d.format('ddd').toUpperCase(),
          dayFull: d.format('dddd, MMMM D'),
          messageCount: count,
        };
        if (!monthsMap.has(monthKey)) monthsMap.set(monthKey, []);
        monthsMap.get(monthKey)!.push(day);
      }

      const result: MonthData[] = [];
      for (const [monthKey, days] of monthsMap.entries()) {
        result.push({
          month: monthKey,
          formattedMonth: dayjs(monthKey + '-01').format('MMMM YYYY').toUpperCase(),
          days,
          totalMessages: days.reduce((s, d) => s + d.messageCount, 0),
        });
      }
      setMonthsData(result);
    } catch (e) {
      console.error('Failed to load chat days', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = async () => {
    const val = searchValue.trim();
    if (!val) { clearSearch(); return; }
    setContentSearchActive(true);
    setSearchingContent(true);
    try {
      const updated = monthsData.map(month => ({
        ...month,
        days: month.days.map(day => {
          const records = allRecordsCache.get(day.date) || [];
          const matched: MatchedRecord[] = [];
          for (let i = 0; i < records.length; i++) {
            const content = records[i].talkContent || '';
            const idx = content.toLowerCase().indexOf(val.toLowerCase());
            if (idx === -1) continue;
            const start = Math.max(0, idx - 20);
            const end = Math.min(content.length, idx + val.length + 20);
            let preview = content.substring(start, end);
            if (start > 0) preview = '...' + preview;
            if (end < content.length) preview += '...';
            matched.push({ transcript: records[i], matchIndex: idx, previewText: preview, recordIndex: i });
            if (matched.length >= 3) break;
          }
          return { ...day, matchedRecords: matched };
        }),
      }));
      setMonthsData(updated);
    } finally {
      setSearchingContent(false);
    }
  };

  const clearSearch = () => {
    setSearchValue('');
    setContentSearchActive(false);
    setMonthsData(prev => prev.map(m => ({
      ...m,
      days: m.days.map(d => ({ ...d, matchedRecords: undefined })),
    })));
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearchSubmit();
    if (e.key === 'Escape') { setSearchFocused(false); searchInputRef.current?.blur(); }
  };

  const filteredMonths = useMemo(() => {
    if (!contentSearchActive) return monthsData;
    return monthsData
      .map(m => {
        const days = m.days.filter(d => d.matchedRecords && d.matchedRecords.length > 0);
        if (!days.length) return null;
        return { ...m, days, totalMessages: days.reduce((s, d) => s + d.messageCount, 0) };
      })
      .filter(Boolean) as MonthData[];
  }, [monthsData, contentSearchActive]);

  const openDateModal = async (date: string, recordIndex?: number) => {
    setSelectedDate(date);
    setModalVisible(true);
    setModalLoading(true);
    setHighlightedRecordIndex(recordIndex ?? null);
    try {
      const cached = allRecordsCache.get(date);
      if (cached) {
        setChatRecords(cached);
      } else {
        const storage = StorageFactory.getInstance().getProvider();
        const records = await storage.getRecords(dayjs(date));
        setChatRecords(records);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setModalLoading(false);
    }
  };

  useEffect(() => {
    if (!modalVisible || highlightedRecordIndex === null || modalLoading) return;
    const scroll = () => {
      document.getElementById(`cal-rec-${highlightedRecordIndex}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
    const timers = [setTimeout(scroll, 350), setTimeout(scroll, 700)];
    return () => timers.forEach(clearTimeout);
  }, [modalVisible, highlightedRecordIndex, modalLoading]);

  const highlightText = (text: string, term: string): React.ReactNode => {
    if (!term) return text;
    try {
      const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      return text.split(regex).map((part, i) =>
        part.toLowerCase() === term.toLowerCase()
          ? <span key={i} className="calendar-hig__highlight">{part}</span>
          : part
      );
    } catch { return text; }
  };

  return (
    <div className="calendar-hig">
      {/* Search bar */}
      <div className="calendar-hig__search-row">
        <div className="calendar-hig__search-wrap">
          <SearchOutlined className="search-icon" />
          <input
            ref={searchInputRef}
            value={searchValue}
            placeholder={t('search_content')}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            onChange={e => {
              setSearchValue(e.target.value);
              if (!e.target.value) clearSearch();
            }}
            onKeyDown={handleSearchKeyDown}
          />
          {searchValue && (
            <CloseCircleFilled
              className="search-clear"
              onClick={() => { setSearchValue(''); clearSearch(); }}
            />
          )}
        </div>
        {(searchFocused || searchValue) && (
          <button
            className="calendar-hig__search-cancel"
            onMouseDown={e => e.preventDefault()}
            onClick={() => {
              setSearchValue('');
              clearSearch();
              setSearchFocused(false);
              searchInputRef.current?.blur();
            }}
          >
            {t('cancel')}
          </button>
        )}
      </div>

      {/* Active search tag */}
      {contentSearchActive && searchValue && (
        <div className="calendar-hig__search-tag">
          <span>{t('search_for', { term: searchValue })}</span>
          <button onClick={clearSearch}><CloseCircleFilled /></button>
        </div>
      )}

      {/* Content */}
      {(loading || searchingContent) ? (
        <div className="calendar-hig__loading">
          <Spin indicator={<LoadingOutlined style={{ fontSize: 28 }} spin />} />
          <span>{searchingContent ? t('searching_content') : t('loading_history')}</span>
        </div>
      ) : filteredMonths.length === 0 ? (
        <div className="calendar-hig__empty">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={contentSearchActive ? t('no_matching_content') : t('no_chat_history')}
          />
        </div>
      ) : (
        filteredMonths.map(month => (
          <div key={month.month} className="calendar-hig__month-section">
            <div className="calendar-hig__month-header">
              <span>{month.formattedMonth}</span>
              <span className="calendar-hig__month-total">
                {month.totalMessages} {month.totalMessages === 1 ? t('message') : t('messages')}
              </span>
            </div>
            <div className="calendar-hig__month-list">
              {month.days.map((day, dayIdx) => (
                <React.Fragment key={day.date}>
                  <div
                    className="calendar-hig__date-row"
                    onClick={() => openDateModal(day.date)}
                    style={dayIdx === month.days.length - 1 && !contentSearchActive
                      ? { borderBottom: 'none' }
                      : undefined}
                  >
                    <div className="calendar-hig__date-text">
                      <span className="calendar-hig__day-name">{day.dayOfWeek}</span>
                      <span className="calendar-hig__day-number">{day.formattedDate}</span>
                    </div>
                    <div className="calendar-hig__date-meta">
                      <span className="calendar-hig__date-full">{day.dayFull}</span>
                    </div>
                    <span className="calendar-hig__date-badge">
                      {day.messageCount}&nbsp;{day.messageCount === 1 ? t('message') : t('messages')}
                    </span>
                  </div>

                  {contentSearchActive && day.matchedRecords && day.matchedRecords.length > 0 && (
                    <div className="calendar-hig__preview-list">
                      {day.matchedRecords.map((m, mi) => (
                        <div
                          key={mi}
                          className="calendar-hig__preview-item"
                          onClick={() => openDateModal(day.date, m.recordIndex)}
                        >
                          <div className="calendar-hig__preview-speaker">
                            {m.transcript.activeSpeaker}&nbsp;·&nbsp;{dayjs(m.transcript.timestamp).format('HH:mm')}
                          </div>
                          <div className="calendar-hig__preview-text">
                            {highlightText(m.previewText, searchValue)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Record detail modal */}
      <Modal
        title={selectedDate ? dayjs(selectedDate).format('YYYY年M月D日 dddd') : ''}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={680}
        styles={{ body: { padding: 0, maxHeight: '70vh', overflowY: 'auto' } }}
        className="calendar-record-modal"
      >
        {modalLoading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
          </div>
        ) : chatRecords.length === 0 ? (
          <div style={{ padding: '40px' }}>
            <Empty description={t('no_records_for_date')} />
          </div>
        ) : (
          <div ref={modalBodyRef}>
            {chatRecords.map((rec, idx) => (
              <div
                key={idx}
                id={`cal-rec-${idx}`}
                className={`calendar-record-modal__record${
                  highlightedRecordIndex === idx && contentSearchActive
                    ? ' calendar-record-modal__record--highlighted'
                    : ''
                }`}
              >
                <div className="calendar-record-modal__record-left">
                  <div className="calendar-record-modal__record-speaker">{rec.activeSpeaker}</div>
                  <div className="calendar-record-modal__record-content">
                    {contentSearchActive && searchValue
                      ? highlightText(rec.talkContent || '', searchValue)
                      : rec.talkContent}
                  </div>
                </div>
                <div className="calendar-record-modal__record-time">
                  {dayjs(rec.timestamp).format('HH:mm:ss')}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Calendar;
