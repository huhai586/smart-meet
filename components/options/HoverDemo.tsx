import React from 'react';
import { Popover } from 'antd';
import './hover-demo.scss';

export const HOVER_DEMO_KIND = {
  CAPTION_TOGGLE: 'caption-toggle',
  STICKER: 'sticker',
  WORD_CLICK: 'word-click',
  AUTO_TRANSLATE: 'auto-translate',
} as const;

export type HoverDemoKind = (typeof HOVER_DEMO_KIND)[keyof typeof HOVER_DEMO_KIND];

/* ── Shared pieces ── */

const Pointer = () => (
  <svg className="hover-demo__pointer" width="12" height="16" viewBox="0 0 12 16">
    <path
      d="M1 1 L1 13 L4.2 10.2 L6.4 15 L8.4 14.1 L6.2 9.4 L10.6 9.4 Z"
      strokeWidth="1"
      strokeLinejoin="round"
    />
  </svg>
);

const MeetWindow = ({ children }: { children?: React.ReactNode }) => (
  <div className="hover-demo__window">
    <div className="hover-demo__tile">
      <span className="hover-demo__avatar" />
    </div>
    {children}
  </div>
);

const ControlBar = ({ children }: { children?: React.ReactNode }) => (
  <div className="hover-demo__bar">
    <span className="hover-demo__dot" />
    <span className="hover-demo__dot" />
    <span className="hover-demo__dot" />
    {children}
  </div>
);

/* ── Illustrations (no text, pure CSS keyframes) ── */

const CaptionToggleIllustration = () => (
  <MeetWindow>
    <div className="hover-demo__caption">
      <span className="hover-demo__bar-line" style={{ width: 30 }} />
      <span className="hover-demo__bar-line" style={{ width: 22 }} />
      <span className="hover-demo__bar-line" style={{ width: 26 }} />
    </div>
    <ControlBar>
      <span className="hover-demo__extra" />
    </ControlBar>
    <span className="hover-demo__ripple" />
    <Pointer />
  </MeetWindow>
);

const StickerIllustration = () => (
  <MeetWindow>
    <div className="hover-demo__note">
      <span className="hover-demo__note-line" style={{ width: 28 }} />
      <span className="hover-demo__note-line" style={{ width: 20 }} />
      <span className="hover-demo__note-line" style={{ width: 24 }} />
    </div>
    <ControlBar />
  </MeetWindow>
);

const WORD_COUNT = 5;
const HIT_WORD_INDEX = 2;

const WordClickIllustration = () => (
  <MeetWindow>
    <div className="hover-demo__card">
      <span className="hover-demo__card-line hover-demo__card-line--gray" style={{ width: '70%' }} />
      <span className="hover-demo__card-line hover-demo__card-line--accent" style={{ width: '50%' }} />
    </div>
    <div className="hover-demo__words">
      {Array.from({ length: WORD_COUNT }, (_, idx) => (
        <span
          key={idx}
          className={
            idx === HIT_WORD_INDEX
              ? 'hover-demo__word hover-demo__word--hit'
              : 'hover-demo__word'
          }
        />
      ))}
    </div>
    <span className="hover-demo__ripple" />
    <Pointer />
  </MeetWindow>
);

const AutoTranslateIllustration = () => (
  <MeetWindow>
    <div className="hover-demo__subs">
      <div className="hover-demo__sub-row">
        <span className="hover-demo__bar-line" style={{ width: 40 }} />
        <span className="hover-demo__bar-line" style={{ width: 26 }} />
        <span className="hover-demo__bar-line" style={{ width: 46 }} />
        <span className="hover-demo__bar-line" style={{ width: 18 }} />
      </div>
      <div className="hover-demo__sub-row">
        <span className="hover-demo__lang-dot" />
        <span className="hover-demo__translation-bar" />
      </div>
    </div>
  </MeetWindow>
);

const ILLUSTRATIONS: Record<HoverDemoKind, React.FC> = {
  [HOVER_DEMO_KIND.CAPTION_TOGGLE]: CaptionToggleIllustration,
  [HOVER_DEMO_KIND.STICKER]: StickerIllustration,
  [HOVER_DEMO_KIND.WORD_CLICK]: WordClickIllustration,
  [HOVER_DEMO_KIND.AUTO_TRANSLATE]: AutoTranslateIllustration,
};

interface HoverDemoProps {
  kind: HoverDemoKind;
  children: React.ReactNode;
}

/** Wraps a setting title; hovering it shows a looping CSS illustration of the feature. */
export const HoverDemo: React.FC<HoverDemoProps> = ({ kind, children }) => {
  const Illustration = ILLUSTRATIONS[kind];

  return (
    <Popover
      placement="right"
      trigger="hover"
      mouseEnterDelay={0.2}
      overlayClassName="hover-demo-popover"
      content={
        <div className={`hover-demo hover-demo--${kind}`} aria-hidden="true">
          <Illustration />
        </div>
      }
    >
      <span className="hover-demo__target">{children}</span>
    </Popover>
  );
};
