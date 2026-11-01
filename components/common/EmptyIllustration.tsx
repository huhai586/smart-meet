import React from 'react';
import './empty-illustration.scss';

/** What the empty place is waiting for: captions to appear, a summary to be written, or words to be kept. */
export const EmptyKind = {
  CAPTIONS: 'captions',
  SUMMARY: 'summary',
  WORDS: 'words',
} as const;
export type EmptyKind = (typeof EmptyKind)[keyof typeof EmptyKind];

const widths = (...values: string[]) => values.map((w, i) => ({ '--w': w, '--i': i }) as React.CSSProperties);

/** A small looping animation for an empty state, drawn in CSS with no text, so it needs no translation. */
const EmptyIllustration: React.FC<{ kind: EmptyKind }> = ({ kind }) => {
  if (kind === EmptyKind.CAPTIONS) {
    const [first, second, third] = widths('100%', '78%', '52%');
    return (
      <div className="ei ei--captions" aria-hidden="true">
        <div className="ei__card">
          <span className="ei__avatar" />
          <div className="ei__lines">
            <span className="ei__line" style={first}><i /></span>
            <span className="ei__line" style={second}><i /></span>
            <span className="ei__line" style={third}><i /><b className="ei__caret" /></span>
          </div>
        </div>
      </div>
    );
  }

  if (kind === EmptyKind.SUMMARY) {
    const [a, b, c] = widths('100%', '88%', '62%');
    return (
      <div className="ei ei--summary" aria-hidden="true">
        <div className="ei__doc">
          <i className="ei__title" />
          <i className="ei__text" style={a} />
          <i className="ei__text" style={b} />
          <i className="ei__text" style={c} />
        </div>
        <span className="ei__spark ei__spark--a" />
        <span className="ei__spark ei__spark--b" />
      </div>
    );
  }

  return (
    <div className="ei ei--words" aria-hidden="true">
      <div className="ei__book">
        <span className="ei__ribbon" />
        <i className="ei__rule" />
        <span className="ei__slot" />
        <i className="ei__rule ei__rule--sentence" />
      </div>
      <span className="ei__chip" />
    </div>
  );
};

export default EmptyIllustration;
