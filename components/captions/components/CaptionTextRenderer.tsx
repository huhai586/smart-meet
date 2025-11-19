import React, { memo } from 'react';

interface WordSegment {
    type: 'word' | 'space';
    content: string;
    isHighlighted?: boolean;
}

interface CaptionTextRendererProps {
    content: string;
    domainKeyWords: string[];
    specificWords: string[];
    isRTL: boolean;
}

// Parse text into segments (words and spaces)
const parseTextToSegments = (text: string): WordSegment[] => {
    const segments: WordSegment[] = [];
    const regex = /(\S+)|(\s+)/g;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
        if (match[1]) {
            // Word
            segments.push({
                type: 'word',
                content: match[1]
            });
        } else if (match[2]) {
            // Space
            segments.push({
                type: 'space',
                content: match[2]
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
const ClickableWord = memo(({ word, isHighlighted }: { word: string; isHighlighted: boolean }) => {
    if (isHighlighted) {
        return (
            <span className="clickable-word" data-word={word}>
                <b className="highlight">{word}</b>
            </span>
        );
    }
    
    return (
        <span className="clickable-word" data-word={word}>
            {word}
        </span>
    );
}, (prev, next) => {
    // Only re-render if word or highlight status changes
    return prev.word === next.word && prev.isHighlighted === next.isHighlighted;
});

ClickableWord.displayName = 'ClickableWord';

export const CaptionTextRenderer = memo(({ 
    content, 
    domainKeyWords, 
    specificWords,
    isRTL 
}: CaptionTextRendererProps) => {
    const segments = parseTextToSegments(content);
    const allKeywords = [...domainKeyWords, ...specificWords];
    
    return (
        <div className={`caption-text ${isRTL ? 'rtl' : ''}`}>
            {segments.map((segment, index) => {
                if (segment.type === 'space') {
                    return <React.Fragment key={`space-${index}`}>{segment.content}</React.Fragment>;
                }
                
                const isHighlighted = shouldHighlight(segment.content, allKeywords);
                
                return (
                    <ClickableWord 
                        key={`word-${index}-${segment.content}`}
                        word={segment.content}
                        isHighlighted={isHighlighted}
                    />
                );
            })}
        </div>
    );
}, (prev, next) => {
    // Only re-render if content or keywords change
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
