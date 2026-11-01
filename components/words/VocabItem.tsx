import React from 'react';
import { BookOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useI18n } from '../../utils/i18n';
import { splitAroundWord, type VocabEntry } from '../../utils/vocab-core';
import './vocab-item.scss';

interface VocabItemProps {
  entry: VocabEntry;
  onOpenDictionary: (word: string) => void;
  onRemove: (word: string) => void;
}

/** One looked-up word: what it means, and the sentence it was heard in. */
const VocabItem: React.FC<VocabItemProps> = ({ entry, onOpenDictionary, onRemove }) => {
  const { t } = useI18n();
  const parts = splitAroundWord(entry.sentence, entry.word);
  const meta = [entry.meetingName, dayjs(entry.lastSeenAt).format('YYYY-MM-DD')].filter(Boolean).join(' · ');

  return (
    <article className="vocab-item">
      <div className="vocab-item__head">
        <span className="vocab-item__word">{entry.word}</span>
        {entry.forms && entry.forms.length > 0 && <span className="vocab-item__forms">{entry.forms.join(' · ')}</span>}
        {entry.count > 1 && (
          <span className="vocab-item__count">{t('word_popover_lookup_count', { n: String(entry.count) })}</span>
        )}
        <span className="vocab-item__actions">
          <button type="button" onClick={() => onOpenDictionary(entry.word)} title={t('vocab_open_dictionary')} aria-label={t('vocab_open_dictionary')}>
            <BookOutlined />
          </button>
          <button type="button" onClick={() => onRemove(entry.word)} title={t('remove')} aria-label={t('remove')}>
            <DeleteOutlined />
          </button>
        </span>
      </div>
      {entry.translation && <div className="vocab-item__translation">{entry.translation}</div>}
      {entry.sentence && (
        <p className="vocab-item__sentence">
          {parts ? (
            <>
              {parts.before}
              <mark>{parts.match}</mark>
              {parts.after}
            </>
          ) : (
            entry.sentence
          )}
        </p>
      )}
      <div className="vocab-item__meta">{meta}</div>
    </article>
  );
};

export default VocabItem;
