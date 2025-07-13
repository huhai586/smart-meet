import { useCallback, useEffect } from 'react';

export const useScrollToVisible = (captionRef: React.RefObject<HTMLDivElement>) => {
    const scrollToMakeVisible = useCallback(() => {
        setTimeout(() => {
            if (captionRef.current) {
                captionRef.current.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'nearest',
                    inline: 'nearest'
                });
            }
        }, 100); // Short delay to ensure DOM update completion
    }, [captionRef]);

    return scrollToMakeVisible;
};

export const useContentChangeEvents = (
    autoTranslatedContent: string,
    aiDataLength: number,
    session: string
) => {
    // Listen for auto-translation content changes and trigger scroll update
    useEffect(() => {
        if (autoTranslatedContent) {
            // Use requestAnimationFrame to ensure DOM update completion before triggering event
            requestAnimationFrame(() => {
                // Dispatch custom event to notify parent component of potential height change
                const event = new CustomEvent('captionContentChanged', {
                    detail: { session, hasTranslation: true }
                });
                window.dispatchEvent(event);
            });
        }
    }, [autoTranslatedContent, session]);

    // Listen for AI answer content changes and trigger scroll update
    useEffect(() => {
        if (aiDataLength > 0) {
            // Use requestAnimationFrame to ensure DOM update completion before triggering event
            requestAnimationFrame(() => {
                // Dispatch custom event to notify parent component of potential height change
                const event = new CustomEvent('captionContentChanged', {
                    detail: { session, hasAiContent: true }
                });
                window.dispatchEvent(event);
            });
        }
    }, [aiDataLength, session]);
}; 