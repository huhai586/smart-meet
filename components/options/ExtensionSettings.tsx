import React from 'react';
import { Typography } from 'antd';
import StyledTitle from '~components/common/StyledTitle';
import Extension from '~components/extension';
import { useI18n } from '~utils/i18n';
import '~styles/extension-settings.scss';

const { Text } = Typography;

const ExtensionSettings: React.FC = () => {
  const { t } = useI18n();

  return (
    <div>
      <StyledTitle subtitle={t('extension_settings_desc')}>{t('extension_settings')}</StyledTitle>

      <div className="extension-settings-special" style={{ padding: "0 20px" }}>
        <Extension />
      </div>
    </div>
  );
};

export default ExtensionSettings;
