import React, { useState } from 'react';
import { SendOutlined } from '@ant-design/icons';
import { useI18n } from '../../utils/i18n';
import { Tooltip } from 'antd';

interface QuestionInputProps {
  onSubmit: (question: string) => void;
  loading: boolean;
}

const QuestionInput: React.FC<QuestionInputProps> = ({ onSubmit, loading }) => {
  const { t } = useI18n();
  const [value, setValue] = useState('');

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

  return (
    <div className="footer">
      <div className={`chat-input-pill ${loading ? 'chat-input-pill--disabled' : ''}`}>
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
 