import React from 'react';
import dayjs from 'dayjs';
import { useI18n } from '~utils/i18n';
import { FREQUENT_THRESHOLD, meetingsOf } from '~utils/vocab-stats';
import type { VocabEntry } from '~utils/vocab-core';

interface WordRankListProps {
  entries: VocabEntry[];
  selectedKey: string;
  onSelect: (key: string) => void;
}

/** The words, each with a bar for how often it was looked up, so the ones that keep coming back stand out. */
const WordRankList: React.FC<WordRankListProps> = ({ entries, selectedKey, onSelect }) => {
  const { t } = useI18n();
  const maxCount = Math.max(1, ...entries.map((entry) => entry.count));

  return (
    <ul className="vocab-rank" role="listbox">
      {entries.map((entry) => {
        const meetings = meetingsOf(entry).length;
        const frequent = entry.count >= FREQUENT_THRESHOLD;
        return (
          <li key={entry.key} role="option" aria-selected={entry.key === selectedKey}>
            <button type="button" className={`vocab-rank__row${entry.key === selectedKey ? ' is-selected' : ''}`} onClick={() => onSelect(entry.key)}>
              <span className="vocab-rank__main">
                <span className="vocab-rank__word">{entry.word}</span>
                {entry.forms.length > 0 && <span className="vocab-rank__forms">{entry.forms.join(' · ')}</span>}
                {entry.translation && <span className="vocab-rank__translation">{entry.translation}</span>}
                <span className="vocab-rank__meta">
                  {meetings > 1 ? `${t('vocab_in_meetings', { n: String(meetings) })} · ` : ''}
                  {dayjs(entry.lastSeenAt).format('MM-DD')}
                </span>
              </span>
              <span className="vocab-rank__score">
                <span className="vocab-rank__count">{entry.count}</span>
                <span className="vocab-rank__bar">
                  <span className={`vocab-rank__fill${frequent ? ' is-frequent' : ''}`} style={{ transform: `scaleX(${entry.count / maxCount})` }} />
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
};

export default WordRankList;
