import React from 'react';
import { Typography, theme, Card, Space } from 'antd';
import UILanguageSelector from '~components/options/UILanguageSelector';
import useI18n from '~utils/i18n';
import StyledTitle from '~components/common/StyledTitle';
import '~styles/ui-language-settings.scss';

const { Text } = Typography;
const { useToken } = theme;

const UILanguageSettings: React.FC = () => {
  const { token: _token } = useToken();
  const { t } = useI18n();

  return (
    <div>
      <StyledTitle subtitle={t('ui_language_desc')}>{t('ui_language')}</StyledTitle>

      <div style={{ padding: "0 20px" }}>
        <Card className="ui-language-settings-card">
          <Space direction="vertical" style={{ width: "100%" }}>
            <div>
              <Text strong className="ui-language-settings-section-title" style={{ display: 'block' }}>
                {t('select_ui_language')}
              </Text>
              <Text type="secondary" className="ui-language-settings-section-description" style={{ display: 'block' }}>
                {t('ui_language_selector_desc')}
              </Text>
            </div>
            <div className="ui-language-settings-selector-wrapper">
              <UILanguageSelector />
            </div>
          </Space>
        </Card>
      </div>
    </div>
  );
};

export default UILanguageSettings;
