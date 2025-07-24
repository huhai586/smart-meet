import { BookOutlined } from '@ant-design/icons';
import { Typography } from 'antd';
import React from 'react';
import type { WordDetail } from "../utils/types/word"
import useI18n from "~utils/i18n"
const { Title, Paragraph } = Typography;

interface WordOriginProps {
  wordDetail: WordDetail;
}

const WordOrigin: React.FC<WordOriginProps> = ({ wordDetail }) => {
  const { t } = useI18n();

  if (!wordDetail?.origin) return null;

  return (
    <div className="origin-section">
      <Title level={4}>
        <BookOutlined className="section-icon" />
        {t('origin')}
      </Title>
      <Paragraph className="origin-text">
        {wordDetail.origin}
      </Paragraph>
    </div>
  );
};

export default WordOrigin;
