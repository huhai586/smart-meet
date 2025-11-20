import React, { memo } from 'react';

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
    const segments = parseTextToSegments(content);
    const allKeywords = [...domainKeyWords, ...specificWords];

    // Render segments
    const renderContent = () => {
        return segments.map((segment, index) => {
            if (segment.type === 'space') {
                return <React.Fragment key={`space-${index}`}>{segment.content}</React.Fragment>;
            } else {
                const isHighlighted = shouldHighlight(segment.content, allKeywords);
                return (
                    <ClickableWord
                        key={`word-${index}-${segment.content}`}
                        word={segment.content}
                        wordIndex={segment.wordIndex}
                        isHighlighted={isHighlighted}
                        isSentenceHighlighted={false}
                        onHoverStart={() => {}}
                        onHoverEnd={() => {}}
                    />
                );
            }
        });
    };

    return (
        <div
            className={`caption-text ${isRTL ? 'rtl' : ''}`}
            style={{ position: 'relative' }}
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
