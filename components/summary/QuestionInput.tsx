import React from 'react';
import Search from 'antd/es/input/Search';
import { useI18n } from '../../utils/i18n';

interface QuestionInputProps {
  onSubmit: (question: string) => void;
  loading: boolean;
}

const QuestionInput: React.FC<QuestionInputProps> = ({ onSubmit, loading }) => {
  const { t } = useI18n();

  const handleSearch = (value: string) => {
    onSubmit(value === '' ? t('summary_question') : value);
  };

  return (
    <div className="footer">
      <Search
        disabled={loading}
        placeholder={t('summary_placeholder')}
        enterButton={t('submit_button')}
        size="large"
        onSearch={handleSearch}
      />
    </div>
  );
};

export default QuestionInput; 