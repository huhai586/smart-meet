import React from 'react';
import { Alert, Button } from 'antd';
import useI18n from '~utils/i18n';

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => {
  const { t } = useI18n();

  return (
    <Alert
      message={t('error')}
      description={error}
      type="error"
      showIcon
      action={
        <Button size="small" onClick={onRetry}>
          {t('retry')}
        </Button>
      }
    />
  );
};

export default ErrorState;
