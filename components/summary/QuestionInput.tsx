import React, { useState, useEffect } from 'react';
import { SendOutlined, AppstoreOutlined, CheckOutlined } from '@ant-design/icons';
import { useI18n } from '../../utils/i18n';
import { Tooltip, Popover } from 'antd';
import { type CustomPrompt, getCustomPrompts } from '../../utils/customPrompts';

interface QuestionInputProps {
  onSubmit: (question: string) => void;
  loading: boolean;
}

const QuestionInput: React.FC<QuestionInputProps> = ({ onSubmit, loading }) => {
  const { t } = useI18n();
  const [value, setValue] = useState('');
  const [prompts, setPrompts] = useState<CustomPrompt[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [popoverOpen, setPopoverOpen] = useState(false);

  useEffect(() => {
    getCustomPrompts().then(setPrompts);
    // Refresh when storage changes (e.g. user edits in Options)
    const handler = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area === 'local' && changes.customPrompts) {
        setPrompts(changes.customPrompts.newValue ?? []);
      }
    };
    chrome.storage.onChanged.addListener(handler);
    return () => chrome.storage.onChanged.removeListener(handler);
  }, []);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const applyPrompts = () => {
    const contents = prompts
      .filter(p => selected.has(p.id))
      .map(p => p.content)
      .join('\n');
    if (contents) {
      setValue(prev => (prev ? `${prev}\n${contents}` : contents));
    }
    setSelected(new Set());
    setPopoverOpen(false);
  };

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
        <>
          <div className="prompt-picker__list">
            {prompts.map(p => (
              <div
                key={p.id}
                className={`prompt-picker__item ${selected.has(p.id) ? 'prompt-picker__item--selected' : ''}`}
                onClick={() => toggleSelect(p.id)}
              >
                <div className="prompt-picker__item-title">{p.title}</div>
                <div className="prompt-picker__item-preview">{p.content}</div>
                {selected.has(p.id) && <CheckOutlined className="prompt-picker__item-check" />}
              </div>
            ))}
          </div>
          <div className="prompt-picker__footer">
            <button
              className="prompt-picker__apply"
              disabled={selected.size === 0}
              onClick={applyPrompts}
            >
              {t('apply_prompts', { n: String(selected.size) })}
            </button>
          </div>
        </>
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
