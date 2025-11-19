import React, { memo, useState, useCallback, useRef, useEffect } from 'react';
import { TranslationOutlined } from '@ant-design/icons';

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

// Find sentence boundaries for a given word index
const findSentenceBoundaries = (segments: WordSegment[], targetWordIndex: number): { start: number; end: number } => {
    // Sentence ending punctuation
    const sentenceEnders = /[.!?。！？]/;
    
    let start = 0;
    let end = segments.length - 1;
    let targetSegmentIndex = -1;
    
    // Find the segment index for the target word
    for (let i = 0; i < segments.length; i++) {
        if (segments[i].wordIndex === targetWordIndex) {
            targetSegmentIndex = i;
            break;
        }
    }
    
    if (targetSegmentIndex === -1) {
        return { start, end };
    }
    
    // Look backwards for sentence start
    for (let j = targetSegmentIndex - 1; j >= 0; j--) {
        if (segments[j].type === 'word' && sentenceEnders.test(segments[j].content)) {
            // Skip spaces after the punctuation
            start = j + 1;
            while (start < segments.length && segments[start].type === 'space') {
                start++;
            }
            break;
        }
    }
    
    // Look forwards for sentence end
    for (let j = targetSegmentIndex; j < segments.length; j++) {
        if (segments[j].type === 'word' && sentenceEnders.test(segments[j].content)) {
            end = j;
            break;
        }
    }
    
    return { start, end };
};

// Extract sentence text from segments
const extractSentenceText = (segments: WordSegment[], start: number, end: number): string => {
    return segments
        .slice(start, end + 1)
        .map(seg => seg.content)
        .join('');
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
    
    const [hoveredWordIndex, setHoveredWordIndex] = useState<number | null>(null);
    const [sentenceBounds, setSentenceBounds] = useState<{ start: number; end: number } | null>(null);
    const [iconPosition, setIconPosition] = useState<{ top: number; left: number } | null>(null);
    const [isTranslating, setIsTranslating] = useState(false);
    
    const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
    const clearTimerRef = useRef<NodeJS.Timeout | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    
    // Clear all timers on unmount
    useEffect(() => {
        return () => {
            if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
            if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
        };
    }, []);
    
    // Clear highlight when content changes
    useEffect(() => {
        setHoveredWordIndex(null);
        setSentenceBounds(null);
        setIconPosition(null);
        if (hoverTimerRef.current) {
            clearTimeout(hoverTimerRef.current);
            hoverTimerRef.current = null;
        }
        if (clearTimerRef.current) {
            clearTimeout(clearTimerRef.current);
            clearTimerRef.current = null;
        }
    }, [content]);
    
    // Handle word hover start
    const handleHoverStart = useCallback((wordIndex: number) => {
        // Cancel any pending clear timer
        if (clearTimerRef.current) {
            clearTimeout(clearTimerRef.current);
            clearTimerRef.current = null;
        }
        
        setHoveredWordIndex(wordIndex);
        
        // Clear existing timer
        if (hoverTimerRef.current) {
            clearTimeout(hoverTimerRef.current);
        }
        
        // Start 1.5-second timer
        hoverTimerRef.current = setTimeout(() => {
            const bounds = findSentenceBoundaries(segments, wordIndex);
            setSentenceBounds(bounds);
            
            // Calculate icon position - find first word in sentence
            if (containerRef.current) {
                // Find the word index of the first word in the sentence
                let firstWordIndex = -1;
                for (let i = bounds.start; i <= bounds.end; i++) {
                    if (segments[i].type === 'word') {
                        firstWordIndex = segments[i].wordIndex;
                        break;
                    }
                }
                
                if (firstWordIndex >= 0) {
                    const firstWordElement = containerRef.current.querySelector(
                        `.clickable-word[data-word-index="${firstWordIndex}"]`
                    );
                    
                    if (firstWordElement) {
                        const rect = firstWordElement.getBoundingClientRect();
                        const containerRect = containerRef.current.getBoundingClientRect();
                        setIconPosition({
                            top: rect.top - containerRect.top - 32,
                            left: rect.left - containerRect.left
                        });
                    }
                }
            }
        }, 1500);
    }, [segments]);
    
    // Handle hover end
    const handleHoverEnd = useCallback(() => {
        // Clear the 1.5-second timer if still pending
        if (hoverTimerRef.current) {
            clearTimeout(hoverTimerRef.current);
            hoverTimerRef.current = null;
        }
        
        // Start 100ms delay before clearing highlight
        if (clearTimerRef.current) {
            clearTimeout(clearTimerRef.current);
        }
        
        clearTimerRef.current = setTimeout(() => {
            setHoveredWordIndex(null);
            setSentenceBounds(null);
            setIconPosition(null);
        }, 100);
    }, []);
    
    // Handle translation icon click
    const handleTranslateClick = useCallback(async () => {
        if (!sentenceBounds || !onTranslateSentence) return;
        
        const sentenceText = extractSentenceText(segments, sentenceBounds.start, sentenceBounds.end);
        setIsTranslating(true);
        
        try {
            await onTranslateSentence(sentenceText);
        } finally {
            setIsTranslating(false);
        }
    }, [sentenceBounds, segments, onTranslateSentence]);
    
    // Check if a segment is within the highlighted sentence
    const isInSentence = useCallback((segmentIndex: number): boolean => {
        if (!sentenceBounds) return false;
        return segmentIndex >= sentenceBounds.start && segmentIndex <= sentenceBounds.end;
    }, [sentenceBounds]);
    
    // Render segments with sentence wrapper
    const renderContent = () => {
        const result: React.ReactNode[] = [];
        let currentSentenceSegments: React.ReactNode[] = [];
        let currentSentenceStart = 0;
        let inHighlightedSentence = false;
        
        segments.forEach((segment, index) => {
            const isInCurrentSentence = isInSentence(index);
            
            // Check if we're entering or leaving a highlighted sentence
            if (isInCurrentSentence && !inHighlightedSentence) {
                // Starting a new highlighted sentence
                inHighlightedSentence = true;
                currentSentenceStart = index;
                currentSentenceSegments = [];
            } else if (!isInCurrentSentence && inHighlightedSentence) {
                // Ending highlighted sentence - wrap it
                result.push(
                    <span 
                        key={`sentence-${currentSentenceStart}`}
                        className="sentence-highlight-wrapper"
                        onMouseEnter={() => {
                            if (clearTimerRef.current) {
                                clearTimeout(clearTimerRef.current);
                                clearTimerRef.current = null;
                            }
                        }}
                        onMouseLeave={handleHoverEnd}
                    >
                        {currentSentenceSegments}
                    </span>
                );
                inHighlightedSentence = false;
                currentSentenceSegments = [];
            }
            
            // Render the segment
            if (segment.type === 'space') {
                const spaceNode = <React.Fragment key={`space-${index}`}>{segment.content}</React.Fragment>;
                if (inHighlightedSentence) {
                    currentSentenceSegments.push(spaceNode);
                } else {
                    result.push(spaceNode);
                }
            } else {
                const isHighlighted = shouldHighlight(segment.content, allKeywords);
                const wordNode = (
                    <ClickableWord 
                        key={`word-${index}-${segment.content}`}
                        word={segment.content}
                        wordIndex={segment.wordIndex}
                        isHighlighted={isHighlighted}
                        isSentenceHighlighted={isInCurrentSentence}
                        onHoverStart={handleHoverStart}
                        onHoverEnd={handleHoverEnd}
                    />
                );
                
                if (inHighlightedSentence) {
                    currentSentenceSegments.push(wordNode);
                } else {
                    result.push(wordNode);
                }
            }
        });
        
        // Handle case where sentence extends to the end
        if (inHighlightedSentence && currentSentenceSegments.length > 0) {
            result.push(
                <span 
                    key={`sentence-${currentSentenceStart}`}
                    className="sentence-highlight-wrapper"
                    onMouseEnter={() => {
                        if (clearTimerRef.current) {
                            clearTimeout(clearTimerRef.current);
                            clearTimerRef.current = null;
                        }
                    }}
                    onMouseLeave={handleHoverEnd}
                >
                    {currentSentenceSegments}
                </span>
            );
        }
        
        return result;
    };
    
    return (
        <div 
            className={`caption-text ${isRTL ? 'rtl' : ''}`} 
            ref={containerRef}
            style={{ position: 'relative' }}
        >
            {renderContent()}
            
            {/* Translation icon */}
            {iconPosition && sentenceBounds && (
                <div
                    className="sentence-translate-icon"
                    style={{
                        position: 'absolute',
                        top: `${iconPosition.top}px`,
                        left: `${iconPosition.left}px`,
                        zIndex: 1000
                    }}
                    onMouseEnter={() => {
                        // Cancel clear timer when hovering icon
                        if (clearTimerRef.current) {
                            clearTimeout(clearTimerRef.current);
                            clearTimerRef.current = null;
                        }
                    }}
                    onMouseLeave={handleHoverEnd}
                    onClick={(e) => {
                        e.stopPropagation(); // Prevent word click handler
                        handleTranslateClick();
                    }}
                >
                    <TranslationOutlined spin={isTranslating} />
                </div>
            )}
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
