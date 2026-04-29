import React, { useState, useEffect } from 'react';
import { SendOutlined, AppstoreOutlined } from '@ant-design/icons';
import { useI18n } from '../../utils/i18n';
import { Tooltip, Popover } from 'antd';
import { type CustomPrompt, getCustomPrompts } from '../../utils/customPrompts';
import { onConfigChanged } from '../../utils/appConfig';

interface QuestionInputProps {
  onSubmit: (question: string) => void;
  loading: boolean;
}

const QuestionInput: React.FC<QuestionInputProps> = ({ onSubmit, loading }) => {
  const { t } = useI18n();
  const [value, setValue] = useState('');
  const [prompts, setPrompts] = useState<CustomPrompt[]>([]);
  const [popoverOpen, setPopoverOpen] = useState(false);

  useEffect(() => {
    getCustomPrompts().then(setPrompts);
    // Refresh when prompts are edited in Options (any device, via appConfig sync)
    const unsubscribe = onConfigChanged((changes) => {
      if (changes.customPrompts) {
        setPrompts(changes.customPrompts.value ?? []);
      }
    });
    return unsubscribe;
  }, []);

  const selectPrompt = (p: CustomPrompt) => {
    setValue(p.content);
    setPopoverOpen(false);
  };

  const applyPrompts = selectPrompt; // keep reference for any future use

  const handleSubmit = () => {
    const trimmed = value.trim();
    onSubmit(trimmed === '' ? t('summary_question') : trimmed);
    setValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !loading) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const promptList = (
    <div className="prompt-picker">
      {prompts.length === 0 ? (
        <div className="prompt-picker__empty">
          <div>{t('custom_prompts_empty')}</div>
          <div className="prompt-picker__empty-hint">{t('go_to_extension_settings')}</div>
        </div>
      ) : (
        <div className="prompt-picker__list">
          {prompts.map(p => (
            <div
              key={p.id}
              className="prompt-picker__item"
              onClick={() => selectPrompt(p)}
            >
              <div className="prompt-picker__item-title">{p.title}</div>
              <div className="prompt-picker__item-preview">{p.content}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="footer">
      <div className={`chat-input-pill ${loading ? 'chat-input-pill--disabled' : ''}`}>
        {/* Prompt picker — always visible */}
        <Popover
          content={promptList}
          trigger="click"
          open={popoverOpen}
          onOpenChange={setPopoverOpen}
          placement="topLeft"
          arrow={false}
          overlayClassName="prompt-popover"
        >
          <Tooltip title={t('select_prompt')} placement="top">
            <button
              className="chat-input-pill__prompt"
              type="button"
              disabled={loading}
              aria-label={t('select_prompt')}
            >
              <AppstoreOutlined />
            </button>
          </Tooltip>
        </Popover>
        <input
          className="chat-input-pill__input"
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('summary_placeholder')}
          disabled={loading}
          maxLength={2000}
        />
        <Tooltip title="⌘↵ / Ctrl↵" placement="top">
          <button
            className="chat-input-pill__send"
            onClick={handleSubmit}
            disabled={loading}
            type="button"
            aria-label={t('submit_button')}
          >
            <SendOutlined />
          </button>
        </Tooltip>
      </div>
    </div>
  );
};

export default QuestionInput;
