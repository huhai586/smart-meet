import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { matchesVocab } from '../../../utils/vocab-core';

interface WordSegment {
    type: 'word' | 'space';
    content: string;
    isHighlighted?: boolean;
    wordIndex: number; // Track position in original text
}

interface CaptionTextRendererProps {
    content: string;
    domainKeyWords: string[];
    specificWords: string[];
    /** Lookup set of the words the user has looked up before (see vocabLookupSet). */
    savedWords: Set<string>;
    isRTL: boolean;
    onTranslateSentence?: (sentence: string) => Promise<void>;
}

// Parse text into segments (words and spaces)
const parseTextToSegments = (text: string): WordSegment[] => {
    const segments: WordSegment[] = [];
    const regex = /(\S+)|(\s+)/g;
    let match;
    let wordIndex = 0;

    while ((match = regex.exec(text)) !== null) {
        if (match[1]) {
            // Word
            segments.push({
                type: 'word',
                content: match[1],
                wordIndex: wordIndex++
            });
        } else if (match[2]) {
            // Space
            segments.push({
                type: 'space',
                content: match[2],
                wordIndex: -1
            });
        }
    }

    return segments;
};

// Check if a word should be highlighted
const shouldHighlight = (word: string, keywords: string[]): boolean => {
    const cleanWord = word.toLowerCase().replace(/[.,!?;:'"()]/g, '');
    return keywords.some(keyword =>
        cleanWord.includes(keyword.toLowerCase())
    );
};

const noop = () => {};

/** How long the pointer must stay away before a caption goes back to plain text. */
const REVERT_DELAY_MS = 1500;

// Memoized word component
const ClickableWord = memo(({
    word,
    isHighlighted,
    isSaved,
    wordIndex,
    isSentenceHighlighted,
    onHoverStart,
    onHoverEnd
}: {
    word: string;
    isHighlighted: boolean;
    isSaved: boolean;
    wordIndex: number;
    isSentenceHighlighted: boolean;
    onHoverStart: (wordIndex: number) => void;
    onHoverEnd: () => void;
}) => {
    const className = `clickable-word${isSentenceHighlighted ? ' sentence-highlighted' : ''}${isSaved ? ' saved-word' : ''}`;

    if (isHighlighted) {
        return (
            <span
                className={className}
                data-word={word}
                data-word-index={wordIndex}
                onMouseEnter={() => onHoverStart(wordIndex)}
                onMouseLeave={onHoverEnd}
            >
                <b className="highlight">{word}</b>
            </span>
        );
    }

    return (
        <span
            className={className}
            data-word={word}
            data-word-index={wordIndex}
            onMouseEnter={() => onHoverStart(wordIndex)}
            onMouseLeave={onHoverEnd}
        >
            {word}
        </span>
    );
}, (prev, next) => {
    return prev.word === next.word &&
           prev.isHighlighted === next.isHighlighted &&
           prev.isSaved === next.isSaved &&
           prev.isSentenceHighlighted === next.isSentenceHighlighted;
});

ClickableWord.displayName = 'ClickableWord';

export const CaptionTextRenderer = memo(({
    content,
    domainKeyWords,
    specificWords,
    savedWords,
    isRTL,
    onTranslateSentence
}: CaptionTextRendererProps) => {
    // Every word as its own <span> (plus a React component each) is about half of the sidepanel's
    // DOM. Captions start as plain text and only get per-word spans once the pointer enters them,
    // which is before a word can be hovered or clicked.
    const [isInteractive, setIsInteractive] = useState(false);
    const textRef = useRef<HTMLDivElement>(null);
    const segments = parseTextToSegments(content);
    const allKeywords = [...domainKeyWords, ...specificWords];

    const revertTimer = useRef<ReturnType<typeof setTimeout>>();
    useEffect(() => () => clearTimeout(revertTimer.current), []);

    const activate = useCallback(() => {
        clearTimeout(revertTimer.current);
        setIsInteractive(true);
    }, []);

    const scheduleRevert = useCallback(() => {
        clearTimeout(revertTimer.current);
        revertTimer.current = setTimeout(() => {
            const element = textRef.current;
            if (!element) return;
            // Swapping the nodes would drop a selection the user is still working with.
            const selection = window.getSelection();
            if (selection && !selection.isCollapsed && (element.contains(selection.anchorNode) || element.contains(selection.focusNode))) return;
            setIsInteractive(false);
        }, REVERT_DELAY_MS);
    }, []);

    const renderWord = (segment: WordSegment, index: number, isHighlighted: boolean) => (
        <ClickableWord
            key={`word-${index}-${segment.content}`}
            word={segment.content}
            wordIndex={segment.wordIndex}
            isHighlighted={isHighlighted}
            isSaved={matchesVocab(segment.content, savedWords)}
            isSentenceHighlighted={false}
            onHoverStart={noop}
            onHoverEnd={noop}
        />
    );

    // Render segments
    const renderContent = () => {
        if (isInteractive) {
            return segments.map((segment, index) => {
                if (segment.type === 'space') {
                    return <React.Fragment key={`space-${index}`}>{segment.content}</React.Fragment>;
                }
                return renderWord(segment, index, shouldHighlight(segment.content, allKeywords));
            });
        }

        // Plain mode: only keyword and saved-word hits keep their own element (they are styled),
        // everything between them is one text node.
        const nodes: React.ReactNode[] = [];
        let run = '';
        segments.forEach((segment, index) => {
            if (segment.type === 'word' && (shouldHighlight(segment.content, allKeywords) || matchesVocab(segment.content, savedWords))) {
                if (run) nodes.push(run);
                run = '';
                nodes.push(renderWord(segment, index, shouldHighlight(segment.content, allKeywords)));
            } else {
                run += segment.content;
            }
        });
        if (run) nodes.push(run);
        return nodes;
    };

    return (
        <div
            ref={textRef}
            className={`caption-text ${isRTL ? 'rtl' : ''}`}
            style={{ position: 'relative' }}
            onMouseEnter={activate}
            onMouseLeave={isInteractive ? scheduleRevert : undefined}
        >
            {renderContent()}
        </div>
    );
}, (prev, next) => {
    return (
        prev.content === next.content &&
        prev.isRTL === next.isRTL &&
        prev.savedWords === next.savedWords &&
        prev.domainKeyWords.length === next.domainKeyWords.length &&
        prev.specificWords.length === next.specificWords.length &&
        prev.domainKeyWords.every((kw, i) => kw === next.domainKeyWords[i]) &&
        prev.specificWords.every((kw, i) => kw === next.specificWords[i])
    );
});

CaptionTextRenderer.displayName = 'CaptionTextRenderer';
