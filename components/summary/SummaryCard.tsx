import React, { useState, useEffect } from 'react';
import { QuestionCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import MarkdownRenderer from './MarkdownRenderer';
import ProviderIcon from '../common/ProviderIcon';
import { useI18n } from '../../utils/i18n';
import { useLanguageDetection } from '../captions/hooks/useLanguageDetection';
import '../../styles/summary.scss';

export interface CardItemType {
  question: string;
  answer: string;
  fetchComplete: boolean;
  createdAt?: number;
  error?: string;
  providerId?: string;
  providerName?: string;
  providerIcon?: string;
  modelName?: string;
}

interface SummaryCardProps {
  item: CardItemType;
  loading: boolean;
  index: number;
  onRetry?: () => void;
}

const useRelativeTime = (timestamp: number | undefined, t: (k: string, p?: Record<string, string>) => string): string => {
  const compute = () => {
    if (!timestamp) return '';
    const diffMs = Date.now() - timestamp;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return t('time_just_now');
    if (diffMin < 60) return t('time_minutes_ago', { n: String(diffMin) });
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return t('time_hours_ago', { n: String(diffHr) });
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const [label, setLabel] = useState(compute);

  useEffect(() => {
    if (!timestamp) return;
    const id = setInterval(() => setLabel(compute()), 30000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timestamp]);

  return label;
};

const ErrorDetails: React.FC<{ error: string; onRetry?: () => void }> = ({ error, onRetry }) => {
  const [expanded, setExpanded] = useState(false);
  const { t } = useI18n();

  return (
    <div className="summary-error-details">
      <div className="summary-error-details__row">
        <span
          className="summary-error-details__trigger"
          onClick={() => setExpanded(v => !v)}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && setExpanded(v => !v)}
        >
          {expanded ? t('error_collapse') : t('error_expand')}
        </span>
        {onRetry && (
          <button
            className="summary-error-details__retry-btn"
            onClick={onRetry}
            title={t('error_retry') || 'Retry'}
          >
            <ReloadOutlined />
          </button>
        )}
      </div>
      {expanded && (
        <pre className="summary-error-details__pre">{error}</pre>
      )}
    </div>
  );
};

const LoadingDots: React.FC = () => (
  <div className="message-ai__loading">
    <span className="message-ai__loading-dot" />
    <span className="message-ai__loading-dot" />
    <span className="message-ai__loading-dot" />
  </div>
);

const SummaryCard: React.FC<SummaryCardProps> = ({ item, loading, index, onRetry }) => {
  const { t } = useI18n();
  const isRTL = useLanguageDetection(item.answer || '');
  const isLoading = loading && !item.fetchComplete;
  const relativeTime = useRelativeTime(item.createdAt, t);

  const cardClass = [
    'message-ai',
    item.error ? 'message-ai--error' : '',
    isLoading ? 'message-ai--loading' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className="message-group" key={index}>
      {/* User question bubble */}
      <div className="message-user">
        <div className="message-user__bubble">
          <QuestionCircleOutlined className="message-user__icon" />
          <span className="message-user__text">{item.question}</span>
        </div>
      </div>

      {/* Meta row: outside the card, above-left */}
      <div className="message-ai-meta">
        <ProviderIcon providerId={item.providerId || ''} size={15} className="message-ai-meta__icon" />
        <span className="message-ai-meta__name">{item.providerName || 'AI'}</span>
        {relativeTime && (
          <span className="message-ai-meta__time">{relativeTime}</span>
        )}
      </div>

      {/* Loading dots outside the card while waiting */}
      {isLoading && <LoadingDots />}

      {/* AI response card — only rendered once there is content or an error */}
      {!isLoading && (
        <div className={cardClass}>
          <div className={`message-ai__content ${isRTL ? 'rtl' : ''}`}>
            {item.error ? (
              <ErrorDetails error={item.error} onRetry={onRetry} />
            ) : (
              <MarkdownRenderer content={item.answer} />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SummaryCard; 