import React from 'react';
import { BookOutlined, DeleteOutlined } from '@ant-design/icons';
import { Popconfirm } from 'antd';
import dayjs from 'dayjs';
import { useI18n } from '~utils/i18n';
import { meetingsOf } from '~utils/vocab-stats';
import type { VocabEntry } from '~utils/vocab-core';
import HighlightedSentence from './HighlightedSentence';

interface WordDetailProps {
  entry: VocabEntry;
  /** Without these the word is shown read-only, as in the Drive backup. */
  onOpenDictionary?: (word: string) => void;
  onRemove?: (word: string) => void;
}

/** One word and every sentence it came up in, newest first. */
const WordDetail: React.FC<WordDetailProps> = ({ entry, onOpenDictionary, onRemove }) => {
  const { t } = useI18n();
  const meetings = meetingsOf(entry).length;
  const occurrences = [...entry.occurrences].reverse();
  const withSentence = occurrences.filter((occurrence) => occurrence.sentence);
  const withoutSentence = occurrences.length - withSentence.length;

  return (
    <section className="vocab-detail">
      <header className="vocab-detail__head">
        <div className="vocab-detail__title">
          <h2>{entry.word}</h2>
          {entry.forms.map((form) => (
            <span key={form} className="vocab-detail__form">{form}</span>
          ))}
        </div>
        {onOpenDictionary && onRemove && (
          <div className="vocab-detail__actions">
            <button type="button" onClick={() => onOpenDictionary(entry.word)} title={t('vocab_open_dictionary')} aria-label={t('vocab_open_dictionary')}>
              <BookOutlined />
            </button>
            <Popconfirm
              title={t('vocab_remove_confirm')}
              okText={t('remove')}
              cancelText={t('cancel')}
              okButtonProps={{ danger: true }}
              onConfirm={() => onRemove(entry.word)}
            >
              <button type="button" title={t('remove')} aria-label={t('remove')}>
                <DeleteOutlined />
              </button>
            </Popconfirm>
          </div>
        )}
      </header>

      {entry.translation && <div className="vocab-detail__translation">{entry.translation}</div>}
      <div className="vocab-detail__meta">
        {[
          t('word_popover_lookup_count', { n: String(entry.count) }),
          meetings > 0 ? t('vocab_in_meetings', { n: String(meetings) }) : '',
          t('vocab_first_seen', { date: dayjs(entry.firstSeenAt).format('YYYY-MM-DD') }),
        ]
          .filter(Boolean)
          .join(' · ')}
      </div>

      <h3 className="vocab-detail__section">{t('vocab_scenes')}</h3>
      <ol className="vocab-scenes">
        {withSentence.map((occurrence) => (
          <li key={occurrence.id} className="vocab-scenes__item">
            <p className="vocab-scenes__sentence">
              <HighlightedSentence sentence={occurrence.sentence} word={occurrence.word} />
            </p>
            <div className="vocab-scenes__meta">
              {[occurrence.meetingName, dayjs(occurrence.at).format('YYYY-MM-DD HH:mm')].filter(Boolean).join(' · ')}
            </div>
          </li>
        ))}
      </ol>
      {withoutSentence > 0 && <p className="vocab-detail__missing">{t('vocab_no_sentence_count', { n: String(withoutSentence) })}</p>}
    </section>
  );
};

export default WordDetail;
