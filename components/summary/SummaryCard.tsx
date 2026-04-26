import React, { useState, useEffect } from 'react';
import { QuestionCircleOutlined, ReloadOutlined, ExclamationCircleFilled } from '@ant-design/icons';
import MarkdownRenderer from './MarkdownRenderer';
import ProviderIcon from '../common/ProviderIcon';
import { useI18n } from '../../utils/i18n';
import { useLanguageDetection } from '../captions/hooks/useLanguageDetection';
import '../../styles/summary.scss';

// ── Per-provider billing URLs ─────────────────────────────────────────────────
const BILLING_URLS: Record<string, string> = {
  'openai':        'https://platform.openai.com/account/billing',
  'google-gemini': 'https://ai.google.dev/pricing',
  'anthropic':     'https://console.anthropic.com/settings/plans',
  'xai-grok':      'https://x.ai/api',
  'deepseek':      'https://platform.deepseek.com/usage',
  'mistral':       'https://console.mistral.ai/billing',
  'groq':          'https://console.groq.com/settings/billing',
  'together':      'https://api.together.xyz/settings/billing',
  'perplexity':    'https://www.perplexity.ai/settings/api',
  'qwen':          'https://dashscope.console.aliyun.com/billing',
  'zhipu':         'https://open.bigmodel.cn/finance/overview',
  'moonshot':      'https://platform.moonshot.cn/console/billing',
  'doubao':        'https://console.volcengine.com/ark',
  'baichuan':      'https://platform.baichuan-ai.com/console/recharge',
  'yi':            'https://platform.lingyiwanwu.com/recharge',
  'minimax':       'https://platform.minimaxi.com/user-center/basic-information',
  'siliconflow':   'https://cloud.siliconflow.cn/account/finance/recharge',
};

// ── Error classification ──────────────────────────────────────────────────────
interface ParsedError {
  title: string;
  description: string;
  actionLabel?: string;
  actionUrl?: string;
}

const parseErrorMessage = (error: string, t: (k: string) => string, providerId?: string): ParsedError => {
  const e = error.toLowerCase();
  const billingUrl = providerId ? BILLING_URLS[providerId] : undefined;

  if (e.includes('429') || e.includes('quota') || e.includes('rate limit') || e.includes('too many requests')) {
    return {
      title: t('err_title_quota'),
      description: t('err_desc_quota'),
      actionLabel: billingUrl ? t('err_action_quota') : undefined,
      actionUrl: billingUrl,
    };
  }
  if (e.includes('401') || e.includes('invalid api key') || e.includes('authentication') || e.includes('api key')) {
    return {
      title: t('err_title_auth'),
      description: t('err_desc_auth'),
    };
  }
  if (e.includes('403') || e.includes('permission') || e.includes('forbidden')) {
    return {
      title: t('err_title_permission'),
      description: t('err_desc_permission'),
    };
  }
  if (e.includes('network') || e.includes('fetch') || e.includes('failed to fetch') || e.includes('econnrefused')) {
    return {
      title: t('err_title_network'),
      description: t('err_desc_network'),
    };
  }
  if (e.includes('model') || e.includes('not found') || e.includes('404')) {
    return {
      title: t('err_title_model'),
      description: t('err_desc_model'),
    };
  }
  return {
    title: t('err_title_generic'),
    description: t('err_desc_generic'),
  };
};

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

const ErrorDetails: React.FC<{ error: string; providerId?: string; onRetry?: () => void }> = ({ error, providerId, onRetry }) => {
  const [expanded, setExpanded] = useState(false);
  const { t } = useI18n();
  const parsed = parseErrorMessage(error, t, providerId);

  return (
    <div className="summary-error-card">
      {/* Header: icon + title */}
      <div className="summary-error-card__header">
        <ExclamationCircleFilled className="summary-error-card__icon" />
        <span className="summary-error-card__title">{parsed.title}</span>
      </div>

      {/* Description */}
      <p className="summary-error-card__desc">{parsed.description}</p>

      {/* Actions */}
      <div className="summary-error-card__actions">
        <div className="summary-error-card__actions-left">
          {onRetry && (
            <button
              className="summary-error-card__retry-btn"
              onClick={onRetry}
              title={t('error_retry') || 'Retry'}
            >
              <ReloadOutlined />
            </button>
          )}
          <button
            className="summary-error-card__details-btn"
            onClick={() => setExpanded(v => !v)}
          >
            {expanded ? t('error_collapse') : t('error_details')}
          </button>
        </div>
        {parsed.actionLabel && parsed.actionUrl && (
          <a
            className="summary-error-card__action-link"
            href={parsed.actionUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {parsed.actionLabel} →
          </a>
        )}
      </div>

      {/* Technical details (collapsed by default) */}
      {expanded && (
        <pre className="summary-error-card__pre">{error}</pre>
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
              <ErrorDetails error={item.error} providerId={item.providerId} onRetry={onRetry} />
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