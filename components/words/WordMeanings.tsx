import { FileTextOutlined, GlobalOutlined } from "@ant-design/icons"
import { Card, Tag, Typography } from 'antd';
import React from 'react';
import type { WordDetail } from '../utils/types/word';
import useI18n from '~utils/i18n';
import './WordMeanings.scss';
const  { Title, Text } = Typography;

interface WordMeaningsProps {
  meanings: WordDetail['meanings'];
  highlightSynonyms?: boolean;
}

const WordMeanings: React.FC<WordMeaningsProps> = ({ meanings, highlightSynonyms = false }) => {
  const { t } = useI18n();

  const renderMeanings = () => {
    if (!meanings) return null;

    return meanings.map((meaning, index) => (
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
                  <Tag 
                    key={synIndex} 
                    className={`synonym-tag ${highlightSynonyms ? 'highlighted' : ''}`}
                  >
                    {synonym}
                  </Tag>
                ))}
              </div>
            )}
          </div>
        ))}
      </Card>
    ));
  };

  return (
    <div className="meanings-section">
      <Title level={4}>
        <GlobalOutlined className="section-icon" />
        {t('meanings')}
      </Title>
      {renderMeanings()}
    </div>
  );
};

export default WordMeanings;
