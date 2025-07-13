import { useCallback } from 'react';
import { getCurrentTranslationProvider } from '../../../hooks/useTranslationProvider';
import { translateByGoogle, translateByMicrosoft, translateByAI } from '../../../utils/translators';
import { setTranslatedWords } from '../../../utils/translate';
import messageManager from '../../../utils/message-manager';

export const useTranslation = () => {
    // Success and error message handlers
    const success = useCallback((res: string) => {
        messageManager.success(res, 5);
    }, []);

    const error = useCallback((res: string) => {
        messageManager.error(res, 5);
    }, []);

    // Generic translation function
    const translateText = useCallback(async (text: string): Promise<string> => {
        const provider = await getCurrentTranslationProvider();
        console.log(`[translateText] Using provider: ${provider}`);
        
        switch (provider) {
            case 'google':
                return await translateByGoogle(text);
            case 'microsoft':
                return await translateByMicrosoft(text);
            case 'ai':
            default:
                return await translateByAI(text);
        }
    }, []);

    // Handle word click translation
    const handleWordClick = useCallback(async (
        event: React.MouseEvent,
        fallbackContent: string
    ) => {
        event.preventDefault();
        event.stopPropagation();
        
        const target = event.target as HTMLElement;
        
        // Check if clicked element is a word span or highlighted b tag
        let clickableElement = target;
        let word = '';
        
        // If clicked on highlighted b tag, find parent clickable-word span
        if (target.classList.contains('highlight')) {
            let parent = target.parentElement;
            while (parent && !parent.classList.contains('clickable-word')) {
                parent = parent.parentElement;
            }
            if (parent && parent.classList.contains('clickable-word')) {
                clickableElement = parent;
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
                clickableElement = parent;
                word = parent.getAttribute('data-word') || '';
            }
        }
        
        if (word && word.trim()) {
            try {
                console.log(`Clicked word: ${word}`);
                // Save the word to translation history first
                setTranslatedWords(word.replace(".", ''));
                
                const translatedText = await translateText(word);
                success(`${word} → ${translatedText}`);
                
            } catch (err) {
                console.error('Unexpected error in handleWordClick:', err);
                const errorMessage = typeof err === 'string' ? err : 
                                   err?.message || 'Translation failed';
                error(errorMessage);
            }
        } else {
            // If no word found, translate the entire sentence
            try {
                const translatedText = await translateText(fallbackContent);
                success(translatedText);
            } catch (err) {
                console.error('Unexpected error in handleWordClick sentence translation:', err);
                const errorMessage = typeof err === 'string' ? err : 
                                   err?.message || 'Translation failed';
                error(errorMessage);
            }
        }
    }, [translateText, success, error]);

    // Handle text selection translation
    const handleTextSelection = useCallback(async () => {
        const selection = window.getSelection();
        const selectedText = selection?.toString().trim();

        if (selectedText && selectedText.length > 0) {
            try {
                console.log(`Selected text: ${selectedText}`);
                const translatedText = await translateText(selectedText);
                success(`${selectedText} → ${translatedText}`);
            } catch (err) {
                console.error('Unexpected error in handleTextSelection:', err);
                const errorMessage = typeof err === 'string' ? err : 
                                   err?.message || 'Translation failed';
                error(errorMessage);
            }
        }
    }, [translateText, success, error]);

    // Handle manual translation
    const handleManualTranslation = useCallback(async (content: string): Promise<string> => {
        try {
            return await translateText(content);
        } catch (err) {
            console.error('Translation error:', err);
            const errorMessage = typeof err === 'string' ? err : 
                               err?.message || 'Translation failed';
            messageManager.error(errorMessage, 5);
            throw err;
        }
    }, [translateText]);

    return {
        handleWordClick,
        handleTextSelection,
        handleManualTranslation
    };
}; 