import React from 'react';
import { Typography, Card, Space, theme } from 'antd';
import styled from '@emotion/styled';
import { GlobalOutlined } from '@ant-design/icons';
import UILanguageSelector from './UILanguageSelector';
import useI18n from '../utils/i18n';
import StyledTitle from './common/StyledTitle';

const { Title, Text } = Typography;
const { useToken } = theme;

const StyledCard = styled(Card)`
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  }
`;

const IconWrapper = styled.div<{color: string; shadowColor: string}>`
  width: 80px;
  height: 80px;
  border-radius: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  transition: all 0.3s ease;
  background: ${props => props.color};
  box-shadow: 0 4px 12px ${props => props.shadowColor};
`;

const UILanguageSettings: React.FC = () => {
  const { token } = useToken();
  const { t } = useI18n();

  return (
    <div>
      <StyledTitle subtitle={t('ui_language_desc')}>{t('ui_language')}</StyledTitle>

      <div style={{ padding: "0 20px" }}>
        {/* UI Language Selector Section */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <div style={{
              fontSize: '36px',
              marginRight: '15px',
              width: '60px',
              height: '60px',
              background: `${token.colorPrimary}15`,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <GlobalOutlined style={{ fontSize: "32px", color: token.colorPrimary }} />
            </div>
            <div>
              <Title level={4} style={{ margin: 0, fontWeight: 600, color: '#333' }}>
                {t('select_ui_language')}
              </Title>
              <Text type="secondary" style={{ fontSize: '15px' }}>
                {t('ui_language_desc')}
              </Text>
            </div>
          </div>

          <div style={{ maxWidth: "400px" }}>
            <UILanguageSelector />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UILanguageSettings;
