import React, { useState, useEffect } from 'react';
import { Select, message } from 'antd';
import { supportedLanguages, getLanguageDisplay } from '../utils/languages';
import useTranslationLanguage from '../hooks/useTranslationLanguage';
import { useI18n } from '../utils/i18n';

const { Option } = Select;

interface LanguageSelectorProps {
  compact?: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ compact = false }) => {
  const [language, setLanguage] = useTranslationLanguage();
  const { t } = useI18n();
  const [messageApi, contextHolder] = message.useMessage();

  const handleChange = (value: string) => {
    const selectedLanguage = supportedLanguages.find(lang => lang.code === value);
    if (selectedLanguage) {
      setLanguage(selectedLanguage);
      
      // Show success message
      messageApi.success(t('translation_language_set', { language: selectedLanguage.name }));
    }
  };

  return (
    <>
      {contextHolder}
      <Select
        value={language.code}
        onChange={handleChange}
        style={{ width: compact ? 120 : 200 }}
        size={compact ? "small" : "middle"}
      >
        {supportedLanguages.map(lang => (
          <Option key={lang.code} value={lang.code}>
            {compact ? lang.nativeName : getLanguageDisplay(lang)}
          </Option>
        ))}
      </Select>
    </>
  );
};

export default LanguageSelector; 