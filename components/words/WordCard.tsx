import React, { useState, useEffect, useRef } from 'react';
import { MoreOutlined, SoundOutlined } from '@ant-design/icons';
import { useI18n } from '../../utils/i18n';
import './WordCard.scss';

interface WordCardProps {
  word: string;
  translation?: string;
  onTranslate: (word: string) => void;
  onShowDetail: (word: string) => void;
}

const WordCard: React.FC<WordCardProps> = ({
  word,
  translation,
  onTranslate,
  onShowDetail
}) => {
  const { t } = useI18n();
  const [isFlipped, setIsFlipped] = useState(false);
  const hasAutoFlipped = useRef(false);

  // 调试信息
  console.log('WordCard render:', { word, translation: translation ? 'has translation' : 'no translation', isFlipped });

  // 当word变化时重置状态（比如切换tab时）
  useEffect(() => {
    console.log('WordCard word changed, resetting state:', word);
    setIsFlipped(false);
    hasAutoFlipped.current = false;
  }, [word]);

  // 当translation状态变化时处理翻转逻辑
  useEffect(() => {
    if (translation && !isFlipped && !hasAutoFlipped.current) {
      console.log('Auto-flipping card for word:', word);
      setIsFlipped(true);
      hasAutoFlipped.current = true;
    } else if (!translation && isFlipped) {
      // 如果翻译消失了（比如切换tab），重置到正面
      console.log('Translation lost, resetting to front for word:', word);
      setIsFlipped(false);
      hasAutoFlipped.current = false;
    }
  }, [translation, isFlipped, word]);

  const handleCardClick = async () => {
    console.log('Card clicked for word:', word, 'translation:', translation, 'isFlipped:', isFlipped);
    
    if (!translation) {
      // 如果没有翻译，获取翻译后自动翻转
      try {
        await onTranslate(word);
        // 翻译完成后，useEffect会自动翻转
      } catch (error) {
        console.error('Translation failed:', error);
      }
    } else {
      // 如果有翻译结果，直接切换翻转状态
      setIsFlipped(!isFlipped);
    }
  };

  const handleMoreClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡
    onShowDetail(word);
  };

  const handlePronunciation = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    console.log('=== PRONUNCIATION BUTTON CLICKED ===');
    console.log('Word:', word);
    console.log('Event:', e);
    console.log('Event target:', e.target);
    console.log('Event currentTarget:', e.currentTarget);
    
    // 使用浏览器的语音合成API
    if ('speechSynthesis' in window) {
      console.log('Speech synthesis available, speaking:', word);
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      
      utterance.onstart = () => console.log('Speech started');
      utterance.onend = () => console.log('Speech ended');
      utterance.onerror = (error) => console.error('Speech error:', error);
      
      speechSynthesis.speak(utterance);
    } else {
      console.log('Speech synthesis not available');
    }
    
    // 确保事件不会传播
    return false;
  };

  return (
    <div className="word-card-container">
      <div className={`word-card ${isFlipped ? 'flipped' : ''}`}>
        {/* 正面 - 显示单词 */}
        <div className="word-card-front" onClick={handleCardClick}>
          <div className="card-content">
            <div className="word-display">
              <div className="word-text-area">
                <span className="word-text">{word}</span>
              </div>
              <span
                className="pronunciation-btn"
                onClick={handlePronunciation}
                onMouseDown={handlePronunciation}
                title={t('pronunciation')}
              >
                <SoundOutlined />
              </span>
            </div>
          </div>
        </div>

        {/* 反面 - 显示翻译 */}
        <div className="word-card-back" onClick={handleCardClick}>
          <div className="card-content">
            <div className="translation-display">
              <div className="translation-text">
                <span className="translation">{translation}</span>
              </div>
              <div className="card-actions">
                <span
                  className="more-btn"
                  onClick={handleMoreClick}
                  title={t('more')}
                >
                  <MoreOutlined />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WordCard; 