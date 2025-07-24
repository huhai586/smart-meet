import React from 'react';
import { Spin, Typography } from 'antd';
import useI18n from '../../utils/i18n';

const { Text } = Typography;

interface LoadingStateProps {
  message?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({ message }) => {
  const { t } = useI18n();

  return (
    <div className="loading-container">
      <Spin size="large" />
      <Text type="secondary">{message || t('loading_word_details')}</Text>
    </div>
  );
};

export default LoadingState;
