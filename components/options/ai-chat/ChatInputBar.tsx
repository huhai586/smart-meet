import React, { useState, useRef, useCallback } from 'react';
import { ArrowUpOutlined } from '@ant-design/icons';
import ProviderIcon from '~components/common/ProviderIcon';
import type { ConfiguredProvider } from './useAIChat';
import useI18n from '~/utils/i18n';

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
  configuredProviders: ConfiguredProvider[];
  selectedProviderName: string;
  onSelectProvider: (name: string) => void;
}

const ChatInputBar: React.FC<Props> = ({
  onSend,
  disabled,
  placeholder,
  configuredProviders,
  selectedProviderName,
  onSelectProvider,
}) => {
  const { t } = useI18n();
  const [value, setValue] = useState('');
  const [popoverOpen, setPopoverOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const selectedProvider = configuredProviders.find(p => p.aiName === selectedProviderName);

  const resize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 140) + 'px';
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    resize();
  };

  const handleSend = useCallback(() => {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [value, disabled, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = value.trim().length > 0 && !disabled;

  // Close popover when clicking outside
  const handlePopoverBlur = (e: React.FocusEvent) => {
    if (
      !popoverRef.current?.contains(e.relatedTarget as Node) &&
      !btnRef.current?.contains(e.relatedTarget as Node)
    ) {
      setPopoverOpen(false);
    }
  };

  return (
    <div className="ai-chat__input-bar">
      {/* Provider selector popover */}
      {popoverOpen && configuredProviders.length > 0 && (
        <div
          ref={popoverRef}
          className="ai-chat__provider-popover"
          tabIndex={-1}
          onBlur={handlePopoverBlur}
        >
          <div className="ai-chat__provider-popover__title">{t('select_ai_service')}</div>
          {configuredProviders.map(p => (
            <button
              key={p.aiName}
              className={`ai-chat__provider-popover__item${p.aiName === selectedProviderName ? ' ai-chat__provider-popover__item--active' : ''}`}
              onClick={() => {
                onSelectProvider(p.aiName);
                setPopoverOpen(false);
              }}
            >
              <span className="ai-chat__provider-popover__icon">
                <ProviderIcon providerId={p.aiName} size={18} />
              </span>
              <span className="ai-chat__provider-popover__name">
                {p.displayName}
                {p.isDefault && (
                  <span className="ai-chat__provider-popover__default">{t('default_label')}</span>
                )}
              </span>
              <span className="ai-chat__provider-popover__model">{p.modelName}</span>
            </button>
          ))}
        </div>
      )}

      {/* Provider icon button */}
      <button
        ref={btnRef}
        className={`ai-chat__provider-btn${popoverOpen ? ' ai-chat__provider-btn--open' : ''}`}
        onClick={() => setPopoverOpen(v => !v)}
        title={selectedProvider ? `${t('current_provider').replace('{name}', selectedProvider.displayName)}` : t('select_ai')}
        tabIndex={0}
      >
        <span className="ai-chat__provider-btn__icon">
          <ProviderIcon providerId={selectedProviderName || ''} size={18} />
        </span>
      </button>

      <div className="ai-chat__textarea-wrap">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || t('ai_input_placeholder')}
          disabled={disabled}
          rows={1}
        />
      </div>
      <button
        className={`ai-chat__send-btn ${canSend ? 'ai-chat__send-btn--active' : 'ai-chat__send-btn--inactive'}`}
        onClick={handleSend}
        disabled={!canSend}
      >
        <ArrowUpOutlined />
      </button>
    </div>
  );
};

export default ChatInputBar;
