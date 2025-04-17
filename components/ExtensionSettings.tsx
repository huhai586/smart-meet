import React from 'react';
import Extension from './extension';
import StyledTitle from './common/StyledTitle';
import { useI18n } from '../utils/i18n';
import '../styles/extension-settings.scss';

const ExtensionSettings: React.FC = () => {
  const { t } = useI18n();

  return (
    <div className="extension-settings-special" style={{ padding: "20px", maxWidth: "1000px", margin: "0 auto" }}>
      <StyledTitle>{t('extension_settings')}</StyledTitle>
      <Extension />
    </div>
  );
};

export default ExtensionSettings; 