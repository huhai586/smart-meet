import { useCallback, useEffect, useRef, useState } from 'react';
import { getCurrentLanguage } from "./useTranslationLanguage"
import type { WordDetail } from "../utils/types/word"
// 支持的词典API语言映射（基于dictionaryapi.dev实际支持的语言）
const DICTIONARY_API_LANGUAGES = {
  'en': 'en',
  'es': 'es',
  'fr': 'fr',
  'de': 'de',
  'it': 'it',
  'pt': 'pt',
  'ru': 'ru',
  'hi': 'hi'
};

// 检查语言是否支持词典API
const isLanguageSupportedByDictionary = (langCode: string): boolean => {
  return langCode in DICTIONARY_API_LANGUAGES;
};

interface UseWordDetailResult {
  wordDetail: WordDetail | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useWordDetail = (word: string): UseWordDetailResult => {
  const [loading, setLoading] = useState(false);
  const [wordDetail, setWordDetail] = useState<WordDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Use ref to track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);
  
  // Use ref to track current request to allow cancellation
  const currentRequestRef = useRef<AbortController | null>(null);

  const fetchWordDetail = useCallback(async (searchWord: string): Promise<void> => {
    // Cancel any existing request
    if (currentRequestRef.current) {
      currentRequestRef.current.abort();
    }

    // Create new AbortController for this request
    const abortController = new AbortController();
    currentRequestRef.current = abortController;

    if (!isMountedRef.current) return;

    setLoading(true);
    setError(null);
    setWordDetail(null);

    try {
      // 获取当前翻译目标语言
      const currentLanguage = await getCurrentLanguage();
      const targetLangCode = currentLanguage.code;

      console.log(`[useWordDetail] Target language: ${targetLangCode} (${currentLanguage.name})`);

      let apiUrl: string;

      if (isLanguageSupportedByDictionary(targetLangCode)) {
        console.log(`[useWordDetail] Using dictionary API for ${targetLangCode}`);
        
        const apiLang = DICTIONARY_API_LANGUAGES[targetLangCode];
        apiUrl = `https://api.dictionaryapi.dev/api/v2/entries/${apiLang}/${searchWord}`;
      } else {
        console.log(`[useWordDetail] Dictionary API not supported for ${targetLangCode}, using English fallback`);
        
        // 使用英文词典作为后备方案
        apiUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${searchWord}`;
      }

      const response = await fetch(apiUrl, {
        signal: abortController.signal
      });
      
      if (!response.ok) {
        throw new Error(isLanguageSupportedByDictionary(targetLangCode) 
          ? 'Word not found in dictionary API' 
          : 'Word not found in English dictionary API'
        );
      }
      
      const data = await response.json();
      
      // Check if request was aborted
      if (abortController.signal.aborted || !isMountedRef.current) {
        return;
      }
      
      const entry = data[0];
      
      const detail: WordDetail = {
        word: entry.word,
        pronunciation: entry.phonetics?.[0]?.audio || '',
        phonetic: entry.phonetics?.[0]?.text || '',
        meanings: entry.meanings.map((meaning: { 
          partOfSpeech: string; 
          definitions: { definition: string; example: string; synonyms: string[]; }[]; 
        }) => ({
          partOfSpeech: meaning.partOfSpeech,
          definitions: meaning.definitions.slice(0, 3).map((def: { 
            definition: string; 
            example: string; 
            synonyms: string[]; 
          }) => ({
            definition: def.definition,
            example: def.example,
            synonyms: def.synonyms?.slice(0, 3) || []
          }))
        })),
        origin: entry.origin,
        etymology: entry.etymology
      };
      
      if (isMountedRef.current && !abortController.signal.aborted) {
        setWordDetail(detail);
      }

    } catch (err) {
      // Don't set error if request was aborted or component unmounted
      if (abortController.signal.aborted || !isMountedRef.current) {
        return;
      }

      console.error('Error fetching word detail:', err);
      setError('Failed to fetch word details. Please try again.');
    } finally {
      if (isMountedRef.current && !abortController.signal.aborted) {
        setLoading(false);
      }
      
      // Clear the current request ref if it matches this controller
      if (currentRequestRef.current === abortController) {
        currentRequestRef.current = null;
      }
    }
  }, []);

  // Stable refetch function that doesn't change between renders
  const refetch = useCallback(async (): Promise<void> => {
    if (word) {
      await fetchWordDetail(word);
    }
  }, [word, fetchWordDetail]);

  // Effect to fetch word detail when word changes
  useEffect(() => {
    if (!word) return;

    fetchWordDetail(word);

    // Cleanup function to cancel any ongoing request
    return () => {
      if (currentRequestRef.current) {
        currentRequestRef.current.abort();
        currentRequestRef.current = null;
      }
    };
  }, [word, fetchWordDetail]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      if (currentRequestRef.current) {
        currentRequestRef.current.abort();
        currentRequestRef.current = null;
      }
    };
  }, []);

  return {
    wordDetail,
    loading,
    error,
    refetch
  };
};

export default useWordDetail;
