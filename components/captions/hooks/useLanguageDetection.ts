import { useState, useEffect } from 'react';
import { detectLanguage, isRTLLanguage } from '../../../utils/language-detector';

export const useLanguageDetection = (content: string) => {
    const [isRTL, setIsRTL] = useState<boolean | null>(null);

    useEffect(() => {
        if (!content) return;
        if (isRTL !== null) return;
        
        const detectedLang = detectLanguage(content);
        const detectedIsRTL = isRTLLanguage(detectedLang);
        setIsRTL(detectedIsRTL);
    }, [isRTL, content]);

    return isRTL;
}; 