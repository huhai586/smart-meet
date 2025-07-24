import React from 'react';
import { Button, Typography } from 'antd';
import { SoundOutlined } from '@ant-design/icons';
import type { WordDetail } from '../../utils/types/word';

const { Title, Text } = Typography;

interface WordHeaderProps {
  wordDetail: WordDetail;
  word: string;
}

const WordHeader: React.FC<WordHeaderProps> = ({ wordDetail, word }) => {
  const { phonetic, pronunciation } = wordDetail;
  const handlePronunciation = () => {
    if (pronunciation) {
      // Play audio from URL
      const audio = new Audio(pronunciation);
      audio.play().catch(console.error);
    } else {
      // Use browser TTS as fallback
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = 'en-US';
        speechSynthesis.speak(utterance);
      }
    }
  };

  return (
    <div className="word-header">
      <Title level={2} className="word-title">{word}</Title>
      <div className="pronunciation-section">
        {phonetic && (
          <Text className="phonetic">/{phonetic}/</Text>
        )}
        <Button
          type="text"
          icon={<SoundOutlined />}
          onClick={handlePronunciation}
          className="pronunciation-btn"
          title="Play pronunciation"
        />
      </div>
    </div>
  );
};

export default WordHeader;
