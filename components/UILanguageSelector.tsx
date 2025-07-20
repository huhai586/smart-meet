import React from "react";
import { Select } from "antd";
import { supportedLanguages, getLanguageDisplay } from '../utils/languages';
import useUILanguage from '../hooks/useUILanguage';
import { setCachedLanguage, useI18n } from '../utils/i18n';
import messageManager from '../utils/message-manager';

const { Option } = Select;

interface UILanguageSelectorProps {
  compact?: boolean;
}

const UILanguageSelector: React.FC<UILanguageSelectorProps> = ({ compact = false }) => {
  const [language, setLanguage] = useUILanguage();
  const { t } = useI18n();

  const handleChange = (value: string) => {
    const selectedLanguage = supportedLanguages.find(lang => lang.code === value);
    if (selectedLanguage) {
      setLanguage(selectedLanguage);
      setCachedLanguage(selectedLanguage);
      
      // Send message to all open components (popup, sidepanel, options)
      chrome.runtime.sendMessage({ 
        action: "uiLanguageChanged", 
        languageCode: selectedLanguage.code 
      });
      
      // Show success message
      messageManager.success(t('ui_language_set', { language: selectedLanguage.name }));
      
      // Reload page to apply UI language changes
      setTimeout(() => {
        window.location.reload();
      }, 1000);
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

export default UILanguageSelector; 