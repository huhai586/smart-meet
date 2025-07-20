import React, { useState, useEffect } from 'react';
import { Modal, Typography, Divider, Button, Spin, Alert, Card, Tag } from 'antd';
import { SoundOutlined, BookOutlined, GlobalOutlined, FileTextOutlined } from '@ant-design/icons';
import { useI18n } from '../../utils/i18n';
import { getCurrentLanguage } from '../../hooks/useTranslationLanguage';
import './WordDetailModal.scss';

const { Title, Text, Paragraph } = Typography;

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

interface WordDetail {
  word: string;
  pronunciation?: string;
  phonetic?: string;
  meanings: Array<{
    partOfSpeech: string;
    definitions: Array<{
      definition: string;
      example?: string;
      synonyms?: string[];
    }>;
  }>;
  origin?: string;
  etymology?: string;
}

interface WordDetailModalProps {
  visible: boolean;
  word: string;
  onClose: () => void;
}

const WordDetailModal: React.FC<WordDetailModalProps> = ({
  visible,
  word,
  onClose
}) => {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [wordDetail, setWordDetail] = useState<WordDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && word) {
      fetchWordDetail(word);
    }
  }, [visible, word, fetchWordDetail]);

  const fetchWordDetail = useCallback(async (searchWord: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // 获取当前翻译目标语言
      const currentLanguage = await getCurrentLanguage();
      const targetLangCode = currentLanguage.code;
      
      console.log(`[WordDetailModal] Target language: ${targetLangCode} (${currentLanguage.name})`);
      
      // 检查目标语言是否支持词典API
      if (isLanguageSupportedByDictionary(targetLangCode)) {
        console.log(`[WordDetailModal] Using dictionary API for ${targetLangCode}`);
        await fetchFromDictionaryAPI(searchWord, targetLangCode);
      } else {
        console.log(`[WordDetailModal] Dictionary API not supported for ${targetLangCode}, using translation fallback`);
        await fetchWithTranslationFallback(searchWord);
      }
      
    } catch (err) {
      console.error('Error fetching word detail:', err);
      setError(t('loading_word_details_failed') || 'Failed to fetch word details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [t, fetchFromDictionaryAPI, fetchWithTranslationFallback]);

  // 使用词典API获取详情
  const fetchFromDictionaryAPI = useCallback(async (searchWord: string, langCode: string) => {
    try {
      const apiLang = DICTIONARY_API_LANGUAGES[langCode];
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/${apiLang}/${searchWord}`);
      
      if (!response.ok) {
        throw new Error('Word not found in dictionary API');
      }
      
      const data = await response.json();
      const entry = data[0];
      
      const detail: WordDetail = {
        word: entry.word,
        pronunciation: entry.phonetics?.[0]?.audio || '',
        phonetic: entry.phonetics?.[0]?.text || '',
        meanings: entry.meanings.map((meaning: { partOfSpeech: string; definitions: { definition: string; example: string; synonyms: string[]; }[]; }) => ({
          partOfSpeech: meaning.partOfSpeech,
          definitions: meaning.definitions.slice(0, 3).map((def: { definition: string; example: string; synonyms: string[]; }) => ({
            definition: def.definition,
            example: def.example,
            synonyms: def.synonyms?.slice(0, 0) || []
          }))
        })),
        origin: entry.origin,
        etymology: entry.etymology
      };
      
      setWordDetail(detail);
    } catch {
      console.warn(`Dictionary API failed for ${langCode}, falling back to translation`);
      await fetchWithTranslationFallback(searchWord);
    }
  }, [fetchWithTranslationFallback]);

  // 使用英文词典作为后备方案（不进行翻译）
  const fetchWithTranslationFallback = useCallback(async (searchWord: string) => {
    try {
      // 尝试从英文词典API获取信息
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${searchWord}`);
      
      if (!response.ok) {
        throw new Error('Word not found in English dictionary API');
      }
      
      const data = await response.json();
      const entry = data[0];
      
      const detail: WordDetail = {
        word: entry.word,
        pronunciation: entry.phonetics?.[0]?.audio || '',
        phonetic: entry.phonetics?.[0]?.text || '',
        meanings: entry.meanings.map((meaning: { partOfSpeech: string; definitions: { definition: string; example: string; synonyms: string[]; }[]; }) => ({
          partOfSpeech: meaning.partOfSpeech,
          definitions: meaning.definitions.slice(0, 3).map((def: { definition: string; example: string; synonyms: string[]; }) => ({
            definition: def.definition,
            example: def.example,
            synonyms: def.synonyms?.slice(0, 3) || []
          }))
        })),
        origin: entry.origin,
        etymology: entry.etymology
      };
      
      setWordDetail(detail);
    } catch (err) {
      console.error('English dictionary fallback failed:', err);
      throw err;
    }
  }, []);

  const handlePronunciation = () => {
    if (wordDetail?.pronunciation) {
      // 播放音频
      const audio = new Audio(wordDetail.pronunciation);
      audio.play().catch(console.error);
    } else {
      // 使用浏览器TTS
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = 'en-US';
        speechSynthesis.speak(utterance);
      }
    }
  };

  const renderMeanings = () => {
    if (!wordDetail?.meanings) return null;

    return wordDetail.meanings.map((meaning, index) => (
      <Card key={index} className="meaning-card" size="small">
        <div className="part-of-speech">
          <Tag color="blue">{meaning.partOfSpeech}</Tag>
        </div>
        
        {meaning.definitions.map((def, defIndex) => (
          <div key={defIndex} className="definition-item">
            <div className="definition">
              <Text strong>{defIndex + 1}. </Text>
              <Text>{def.definition}</Text>
            </div>
            
            {def.example && (
              <div className="example">
                <FileTextOutlined className="example-icon" />
                <Text italic type="secondary">&quot;{def.example}&quot;</Text>
              </div>
            )}
            
            {def.synonyms && def.synonyms.length > 0 && (
              <div className="synonyms">
                <Text type="secondary">Synonyms: </Text>
                {def.synonyms.map((synonym, synIndex) => (
                  <Tag key={synIndex} className="synonym-tag">{synonym}</Tag>
                ))}
              </div>
            )}
          </div>
        ))}
      </Card>
    ));
  };

  return (
    <Modal
      title={
        <div className="modal-title">
          <BookOutlined className="title-icon" />
          <span>{t('word_details')}</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={480}
      className="word-detail-modal"
    >
      {loading ? (
        <div className="loading-container">
          <Spin size="large" />
          <Text type="secondary">{t('loading_word_details')}</Text>
        </div>
      ) : error ? (
        <Alert
          message={t('error')}
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={() => fetchWordDetail(word)}>
              {t('retry')}
            </Button>
          }
        />
      ) : wordDetail ? (
        <div className="word-detail-content">
          {/* 单词标题和发音 */}
          <div className="word-header">
            <Title level={2} className="word-title">{wordDetail.word}</Title>
            <div className="pronunciation-section">
              {wordDetail.phonetic && (
                <Text className="phonetic">/{wordDetail.phonetic}/</Text>
              )}
              <Button
                type="text"
                icon={<SoundOutlined />}
                onClick={handlePronunciation}
                className="pronunciation-btn"
                title={t('pronunciation')}
              />
            </div>
          </div>

          <Divider />

          {/* 词义列表 */}
          <div className="meanings-section">
            <Title level={4}>
              <GlobalOutlined className="section-icon" />
              {t('meanings')}
            </Title>
            {renderMeanings()}
          </div>

          {/* 词源 */}
          {wordDetail.origin && (
            <>
              <Divider />
              <div className="origin-section">
                <Title level={4}>
                  <BookOutlined className="section-icon" />
                  {t('origin')}
                </Title>
                <Paragraph className="origin-text">
                  {wordDetail.origin}
                </Paragraph>
              </div>
            </>
          )}
        </div>
      ) : null}
    </Modal>
  );
};

export default WordDetailModal; 