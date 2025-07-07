import { Actions } from "~components/captions/caption"
import askAI from "~utils/askAI"
import {setTranslatedWords} from "~utils/translate";
import { getTranslation } from "~utils/i18n";
import { getCurrentUILanguage } from "~hooks/useUILanguage";

const translateSingleWords = async (text: string): Promise<string> => {
    try {
        // Save the word to translation history first
        setTranslatedWords(text);
        
        // Attempt to translate using AI
        const result = await askAI(Actions.TRANSLATE, text);
        return result;
    } catch (error) {
        console.error('[translateSingleWords] Error:', error);
        
        // Get current UI language for error messages
        const currentUILanguage = await getCurrentUILanguage();
        const langCode = currentUILanguage.code;
        
        // Return a user-friendly error message instead of throwing
        const errorMessage = typeof error === 'string' ? error : 
                           error?.message || getTranslation('translation_service_unavailable', langCode);
        
        // For API not ready errors, return a specific message
        if (errorMessage.includes('AI service not ready') || 
            errorMessage.includes('API key not valid') ||
            errorMessage.includes('Invalid API key')) {
            return getTranslation('translation_service_not_configured', langCode);
        }
        
        // For network errors
        if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
            return getTranslation('translation_network_error', langCode);
        }
        
        // For other errors, return a generic message
        return `${getTranslation('translation_failed', langCode)}: ${errorMessage}`;
    }
}

export default translateSingleWords;
