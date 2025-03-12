import React, { useState, useEffect } from 'react';
import { Select, message } from 'antd';
import { supportedLanguages, getLanguageDisplay } from '../utils/languages';
import useTranslationLanguage from '../hooks/useTranslationLanguage';
import { setCachedLanguage, useI18n } from '../utils/i18n';

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
      setCachedLanguage(selectedLanguage);
      
      // Enviar mensaje a todos los componentes abiertos (popup, sidepanel, options)
      chrome.runtime.sendMessage({ 
        action: "languageChanged", 
        languageCode: selectedLanguage.code 
      });
      
      // Mostrar mensaje de éxito
      messageApi.success(t('language_set', { language: selectedLanguage.name }));
      
      // No recargamos la página para permitir la actualización en tiempo real
      // La recarga solo se hace si estamos en la página de opciones que requiere recarga
      const isOptionsPage = window.location.href.includes('options.html');
      if (isOptionsPage) {
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
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