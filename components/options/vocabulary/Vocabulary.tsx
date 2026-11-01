import React, { useMemo, useState } from 'react';
import { Dropdown, Input, Segmented, Select, type MenuProps } from 'antd';
import { BookOutlined, DownloadOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useI18n } from '~utils/i18n';
import useVocab from '~hooks/useVocab';
import { removeVocabWord } from '~utils/vocab';
import { toAnkiText, toCsv } from '~utils/vocab-export';
import { createTextFile, downloadFile } from '~utils/file-utils';
import messageManager from '~utils/message-manager';
import {
  allMeetings,
  filterEntries,
  NO_FILTERS,
  sortEntries,
  summarize,
  type FrequencyFilter,
  type SortKey,
  type VocabFilters,
} from '~utils/vocab-stats';
import WordDetailModal from '~components/words/WordDetailModal';
import WordRankList from './WordRankList';
import WordDetail from './WordDetail';
import MeetingTimeline from './MeetingTimeline';
import './vocabulary.scss';

type View = 'words' | 'meetings';
type Range = 'all' | 'week' | 'month';

const DAY_MS = 24 * 60 * 60 * 1000;
const RANGE_DAYS: Record<Range, number> = { all: 0, week: 7, month: 30 };

/** The words the user looked up in meetings: which keep coming back, and the sentences they came from. */
const Vocabulary: React.FC = () => {
  const { t } = useI18n();
  const entries = useVocab();

  const [view, setView] = useState<View>('words');
  const [query, setQuery] = useState('');
  const [frequency, setFrequency] = useState<FrequencyFilter>('all');
  const [meeting, setMeeting] = useState('');
  const [range, setRange] = useState<Range>('all');
  const [sort, setSort] = useState<SortKey>('count');
  const [selectedKey, setSelectedKey] = useState('');
  const [dictionaryWord, setDictionaryWord] = useState('');

  const filters: VocabFilters = useMemo(
    () => ({ ...NO_FILTERS, query, frequency, meeting, since: RANGE_DAYS[range] ? Date.now() - RANGE_DAYS[range] * DAY_MS : 0 }),
    [query, frequency, meeting, range],
  );
  const summary = useMemo(() => summarize(entries, Date.now()), [entries]);
  const meetings = useMemo(() => allMeetings(entries), [entries]);
  const visible = useMemo(() => sortEntries(filterEntries(entries, filters), sort), [entries, filters, sort]);
  const selected = visible.find((entry) => entry.key === selectedKey) ?? visible[0];

  const exportAnki = () => {
    downloadFile(createTextFile(toAnkiText(visible), `smart-meet-anki-${dayjs().format('YYYYMMDD')}.txt`));
    messageManager.success(t('export_success'));
  };
  const exportCsv = () => {
    downloadFile(createTextFile(toCsv(visible), `smart-meet-words-${dayjs().format('YYYYMMDD')}.csv`, 'text/csv;charset=utf-8'));
    messageManager.success(t('export_success'));
  };
  const exportItems: MenuProps['items'] = [
    { key: 'anki', label: t('vocab_export_anki'), onClick: exportAnki },
    { key: 'csv', label: t('vocab_export_csv'), onClick: exportCsv },
  ];

  const pickWord = (key: string) => {
    setSelectedKey(key);
    setView('words');
  };

  const stats = [
    { label: t('vocab_stat_words'), value: summary.words },
    { label: t('vocab_stat_lookups'), value: summary.lookups },
    { label: t('vocab_stat_new'), value: summary.newThisWeek },
    { label: t('vocab_stat_frequent'), value: summary.frequentWords },
  ];

  return (
    <div className="vocab-page">
      <header className="vocab-page__header">
        <h1>{t('vocab_page_title')}</h1>
        <p>{t('vocab_page_subtitle')}</p>
      </header>

      {entries.length === 0 ? (
        <div className="vocab-page__empty">
          <BookOutlined />
          <p>{t('vocab_page_empty')}</p>
        </div>
      ) : (
        <>
          <div className="vocab-stats">
            {stats.map((stat) => (
              <div key={stat.label} className="vocab-stats__card">
                <span className="vocab-stats__value">{stat.value}</span>
                <span className="vocab-stats__label">{stat.label}</span>
              </div>
            ))}
          </div>

          <div className="vocab-toolbar">
            <Segmented
              value={view}
              onChange={(value) => setView(value as View)}
              options={[
                { label: t('vocab_view_words'), value: 'words' },
                { label: t('vocab_view_meetings'), value: 'meetings' },
              ]}
            />
            <Input
              className="vocab-toolbar__search"
              allowClear
              prefix={<SearchOutlined />}
              placeholder={t('vocab_search_placeholder')}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <Select
              value={frequency}
              onChange={setFrequency}
              options={[
                { value: 'all', label: t('vocab_filter_all') },
                { value: 'frequent', label: t('vocab_filter_frequent') },
                { value: 'once', label: t('vocab_filter_once') },
              ]}
            />
            <Select
              value={meeting}
              onChange={setMeeting}
              popupMatchSelectWidth={false}
              options={[{ value: '', label: t('vocab_filter_meeting_all') }, ...meetings.map((name) => ({ value: name, label: name }))]}
            />
            <Select
              value={range}
              onChange={setRange}
              options={[
                { value: 'all', label: t('vocab_range_all') },
                { value: 'week', label: t('vocab_range_week') },
                { value: 'month', label: t('vocab_range_month') },
              ]}
            />
            {view === 'words' && (
              <Select
                value={sort}
                onChange={setSort}
                options={[
                  { value: 'count', label: t('vocab_sort_count') },
                  { value: 'recent', label: t('vocab_sort_recent') },
                  { value: 'alpha', label: t('vocab_sort_alpha') },
                ]}
              />
            )}
            <Dropdown menu={{ items: exportItems }} trigger={['click']} placement="bottomRight">
              <button type="button" className="vocab-toolbar__export">
                <DownloadOutlined /> {t('vocab_export')}
              </button>
            </Dropdown>
          </div>

          {visible.length === 0 ? (
            <div className="vocab-page__empty">
              <p>{t('vocab_no_results')}</p>
            </div>
          ) : view === 'words' ? (
            <div className="vocab-split">
              <WordRankList entries={visible} selectedKey={selected?.key ?? ''} onSelect={setSelectedKey} />
              {selected && <WordDetail key={selected.key} entry={selected} onOpenDictionary={setDictionaryWord} onRemove={removeVocabWord} />}
            </div>
          ) : (
            <MeetingTimeline entries={visible} onPickWord={pickWord} />
          )}
        </>
      )}

      <WordDetailModal visible={!!dictionaryWord} word={dictionaryWord} onClose={() => setDictionaryWord('')} />
    </div>
  );
};

export default Vocabulary;
