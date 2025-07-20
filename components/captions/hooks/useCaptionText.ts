import { useMemo } from 'react';
import highlight from '../../../utils/highlight';

export const useCaptionText = (
    content: string,
    domainKeyWords: string[],
    specificWords: string[]
) => {
    // Process text with highlighting and word wrapping
    const processedContent = useMemo(() => {
        let processedText = content;
        
        // Apply highlighting if keywords exist
        if (domainKeyWords.length > 0 || specificWords.length > 0) {
            processedText = highlight(processedText, [...domainKeyWords, ...specificWords]);
        }
        
        // Wrap words in clickable spans while preserving HTML tags
        const wrapWordsInSpans = (text: string): string => {
            const parts: Array<{type: 'html' | 'text', content: string}> = [];
            let currentIndex = 0;
            
            // Find all HTML tags
            const htmlTagRegex = /<[^>]+>/g;
            let match;
            
            while ((match = htmlTagRegex.exec(text)) !== null) {
                // Add text before tag
                if (match.index > currentIndex) {
                    parts.push({
                        type: 'text',
                        content: text.substring(currentIndex, match.index)
                    });
                }
                
                // Add HTML tag
                parts.push({
                    type: 'html',
                    content: match[0]
                });
                
                currentIndex = match.index + match[0].length;
            }
            
            // Add remaining text
            if (currentIndex < text.length) {
                parts.push({
                    type: 'text',
                    content: text.substring(currentIndex)
                });
            }
            
            // Process each part
            return parts.map(part => {
                if (part.type === 'html') {
                    return part.content;
                } else {
                    // Only wrap words in plain text parts
                    return part.content.replace(/(\S+)/g, (word) => {
                        return `<span class="clickable-word" data-word="${word.replace(/"/g, '&quot;')}">${word}</span>`;
                    });
                }
            }).join('');
        };
        
        return wrapWordsInSpans(processedText);
    }, [content, domainKeyWords, specificWords]);

    return processedContent;
}; 