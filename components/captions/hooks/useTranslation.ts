import { useCallback } from 'react';
import { translateText, translateWord } from '../../../utils/unified-translation';
import { recordLookup } from '../../../utils/vocab';
import messageManager from '../../../utils/message-manager';

export const useTranslation = () => {
    // Success and error message handlers
    const success = useCallback((res: string) => {
        messageManager.success(res, 5);
    }, []);

    const error = useCallback((res: string) => {
        messageManager.error(res, 5);
    }, []);

    // Handle word click translation
    const handleWordClick = useCallback(async (
        event: React.MouseEvent,
        fallbackContent: string,
        wordOverride?: string,
        meetingName?: string
    ) => {
        event.preventDefault();
        event.stopPropagation();
        
        // Check if there's selected text - if so, let handleTextSelection handle it
        const selection = window.getSelection();
        if (selection && selection.toString().trim().length > 0) {
            return; // Don't process click when text is selected
        }
        
        const target = event.target as HTMLElement;
        
        // Check if clicked element is a word span or highlighted b tag
        let _clickableElement = target;
        let word = wordOverride ?? '';
        
        // If clicked on highlighted b tag, find parent clickable-word span
        if (wordOverride !== undefined) {
            // The caller already resolved the word (plain-text caption), nothing to look up.
        } else if (target.classList.contains('highlight')) {
            let parent = target.parentElement;
            while (parent && !parent.classList.contains('clickable-word')) {
                parent = parent.parentElement;
            }
            if (parent && parent.classList.contains('clickable-word')) {
                _clickableElement = parent;
                word = parent.getAttribute('data-word') || '';
            } else {
                word = target.textContent || '';
            }
        } else if (target.classList.contains('clickable-word')) {
            word = target.getAttribute('data-word') || '';
        } else {
            // Look up for clickable-word parent element
            let parent = target.parentElement;
            while (parent && !parent.classList.contains('clickable-word')) {
                parent = parent.parentElement;
            }
            if (parent && parent.classList.contains('clickable-word')) {
                _clickableElement = parent;
                word = parent.getAttribute('data-word') || '';
            }
        }
        
        if (word && word.trim()) {
            try {
                console.log(`Clicked word: ${word}`);
                // Looking a word up saves it with the caption line it was heard in
                let translatedText = '';
                try {
                    translatedText = await translateWord(word, { silent: true, context: fallbackContent });
                    // Show only translation result, not original word
                    success(translatedText);
                } finally {
                    // The lookup counts even when no translation came back
                    void recordLookup({ word, translation: translatedText, sentence: fallbackContent, meetingName });
                }
                
            } catch (err) {
                console.error('Unexpected error in handleWordClick:', err);
                const errorMessage = typeof err === 'string' ? err : 
                                   err?.message || 'Translation failed';
                error(errorMessage);
            }
        } else {
            // If no word found, translate the entire sentence
            try {
                const translatedText = await translateText(fallbackContent, { silent: true });
                success(translatedText);
            } catch (err) {
                console.error('Unexpected error in handleWordClick sentence translation:', err);
                const errorMessage = typeof err === 'string' ? err : 
                                   err?.message || 'Translation failed';
                error(errorMessage);
            }
        }
    }, [success, error]);

    // Handle text selection translation
    const handleTextSelection = useCallback(async () => {
        const selection = window.getSelection();
        const selectedText = selection?.toString().trim();

        if (selectedText && selectedText.length > 0) {
            try {
                console.log(`Selected text: ${selectedText}`);
                const translatedText = await translateText(selectedText, { silent: true });
                // Show only translation result, not original text
                success(translatedText);
            } catch (err) {
                console.error('Unexpected error in handleTextSelection:', err);
                const errorMessage = typeof err === 'string' ? err : 
                                   err?.message || 'Translation failed';
                error(errorMessage);
            }
        }
    }, [success, error]);

    // Handle manual translation
    const handleManualTranslation = useCallback(async (content: string): Promise<string> => {
        try {
            return await translateText(content, { silent: true });
        } catch (err) {
            console.error('Translation error:', err);
            const errorMessage = typeof err === 'string' ? err : 
                               err?.message || 'Translation failed';
            messageManager.error(errorMessage, 5);
            throw err;
        }
    }, []);

    return {
        handleWordClick,
        handleTextSelection,
        handleManualTranslation
    };
}; 