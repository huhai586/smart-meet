import React from "react"
import { Select } from "antd"
import { supportedLanguages, getLanguageDisplay } from '../../utils/languages';
import useTranslationLanguage from '../../hooks/useTranslationLanguage';
import { useI18n } from '../../utils/i18n';
import messageManager from '../../utils/message-manager';

const { Option } = Select;

interface LanguageSelectorProps {
  compact?: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ compact = false }) => {
  const [language, setLanguage] = useTranslationLanguage();
  const { t } = useI18n();

  const handleChange = (value: string) => {
    const selectedLanguage = supportedLanguages.find(lang => lang.code === value);
    if (selectedLanguage) {
      setLanguage(selectedLanguage);
      
      // Show success message
      messageManager.success(t('translation_language_set', { language: selectedLanguage.name }));
    }
  };

  return (
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
  );
};

export default LanguageSelector; 