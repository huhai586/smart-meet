import React, { memo, useCallback, useRef, useState } from 'react';

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

// Memoized word component
const ClickableWord = memo(({
    word,
    isHighlighted,
    wordIndex,
    isSentenceHighlighted,
    onHoverStart,
    onHoverEnd
}: {
    word: string;
    isHighlighted: boolean;
    wordIndex: number;
    isSentenceHighlighted: boolean;
    onHoverStart: (wordIndex: number) => void;
    onHoverEnd: () => void;
}) => {
    const className = `clickable-word${isSentenceHighlighted ? ' sentence-highlighted' : ''}`;

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
           prev.isSentenceHighlighted === next.isSentenceHighlighted;
});

ClickableWord.displayName = 'ClickableWord';

export const CaptionTextRenderer = memo(({
    content,
    domainKeyWords,
    specificWords,
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

    const activate = useCallback(() => {
        // The search UI splits this element's text nodes in place; re-rendering it into spans now
        // would make React remove nodes that are no longer there. Clicks still work (see Caption).
        if (textRef.current?.querySelector('.search-highlight')) return;
        setIsInteractive(true);
    }, []);

    const renderWord = (segment: WordSegment, index: number, isHighlighted: boolean) => (
        <ClickableWord
            key={`word-${index}-${segment.content}`}
            word={segment.content}
            wordIndex={segment.wordIndex}
            isHighlighted={isHighlighted}
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

        // Plain mode: only keyword hits keep their own element (they are styled), everything
        // between them is one text node.
        const nodes: React.ReactNode[] = [];
        let run = '';
        segments.forEach((segment, index) => {
            if (segment.type === 'word' && shouldHighlight(segment.content, allKeywords)) {
                if (run) nodes.push(run);
                run = '';
                nodes.push(renderWord(segment, index, true));
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
            onMouseEnter={isInteractive ? undefined : activate}
        >
            {renderContent()}
        </div>
    );
}, (prev, next) => {
    return (
        prev.content === next.content &&
        prev.isRTL === next.isRTL &&
        prev.domainKeyWords.length === next.domainKeyWords.length &&
        prev.specificWords.length === next.specificWords.length &&
        prev.domainKeyWords.every((kw, i) => kw === next.domainKeyWords[i]) &&
        prev.specificWords.every((kw, i) => kw === next.specificWords[i])
    );
});

CaptionTextRenderer.displayName = 'CaptionTextRenderer';
