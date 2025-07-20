import React from 'react';
import { Typography, theme } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import UILanguageSelector from '../UILanguageSelector';
import useI18n from '../../utils/i18n';
import StyledTitle from '../common/StyledTitle';
import '../../styles/ui-language-settings.scss';

const { Title, Text } = Typography;
const { useToken } = theme;

const UILanguageSettings: React.FC = () => {
  const { token } = useToken();
  const { t } = useI18n();

  return (
    <div>
      <StyledTitle subtitle={t('ui_language_desc')}>{t('ui_language')}</StyledTitle>

      <div className="ui-language-settings-section">
        {/* UI Language Selector Section */}
        <div className="ui-language-settings-selector-section">


          <div className="ui-language-settings-selector-wrapper">
            <UILanguageSelector />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UILanguageSettings;
