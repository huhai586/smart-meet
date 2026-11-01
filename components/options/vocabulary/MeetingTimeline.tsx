import React, { useMemo } from 'react';
import { useI18n } from '~utils/i18n';
import { groupByMeetingDay } from '~utils/vocab-stats';
import type { VocabEntry } from '~utils/vocab-core';
import HighlightedSentence from './HighlightedSentence';

interface MeetingTimelineProps {
  entries: VocabEntry[];
  onPickWord: (key: string) => void;
}

/** What the user looked up, meeting by meeting: a way to remember a conversation through its words. */
const MeetingTimeline: React.FC<MeetingTimelineProps> = ({ entries, onPickWord }) => {
  const { t } = useI18n();
  const groups = useMemo(() => groupByMeetingDay(entries), [entries]);

  return (
    <div className="vocab-meetings">
      {groups.map((group) => (
        <section key={`${group.day}-${group.meeting}`} className="vocab-meeting">
          <header className="vocab-meeting__head">
            <h3>{group.meeting || t('vocab_no_meeting')}</h3>
            <span>{group.day} · {t('vocab_count', { n: String(group.items.length) })}</span>
          </header>
          <ul>
            {group.items.map(({ entry, occurrence }) => (
              <li key={occurrence.id} className="vocab-meeting__item">
                <button type="button" className="vocab-meeting__word" onClick={() => onPickWord(entry.key)}>{occurrence.word}</button>
                <span className="vocab-meeting__sentence">
                  {occurrence.sentence ? <HighlightedSentence sentence={occurrence.sentence} word={occurrence.word} /> : t('vocab_no_sentence')}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
};

export default MeetingTimeline;
