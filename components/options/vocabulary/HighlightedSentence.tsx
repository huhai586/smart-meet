import React from 'react';
import { splitAroundWord } from '~utils/vocab-core';

interface HighlightedSentenceProps {
  sentence: string;
  /** The word as it was spelled in this sentence. */
  word: string;
}

/** A caption line with the word that was looked up marked. */
const HighlightedSentence: React.FC<HighlightedSentenceProps> = ({ sentence, word }) => {
  const parts = splitAroundWord(sentence, word);
  if (!parts) return <>{sentence}</>;
  return (
    <>
      {parts.before}
      <mark>{parts.match}</mark>
      {parts.after}
    </>
  );
};

export default HighlightedSentence;
