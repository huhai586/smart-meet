import React from 'react';
import { Alert, Button } from 'antd';

interface ErrorStateProps {
  message: string;
  description?: string;
  onRetry?: () => void;
  type?: 'error' | 'warning' | 'info' | 'success';
  showIcon?: boolean;
  style?: React.CSSProperties;
  className?: string;
  retryText?: string;
  retryButtonProps?: {
    type?: 'default' | 'primary' | 'dashed' | 'link' | 'text';
    size?: 'large' | 'middle' | 'small';
    danger?: boolean;
    ghost?: boolean;
  };
}

const ErrorState: React.FC<ErrorStateProps> = ({
  message,
  description,
  onRetry,
  type = 'error',
  showIcon = true,
  style,
  className,
  retryText = 'Retry',
  retryButtonProps = { size: 'small' }
}) => {
  return (
    <Alert
      message={message}
      description={description}
      type={type}
      showIcon={showIcon}
      style={style}
      className={className}
      action={
        onRetry ? (
          <Button onClick={onRetry} {...retryButtonProps}>
            {retryText}
          </Button>
        ) : undefined
      }
    />
  );
};

export default ErrorState;
