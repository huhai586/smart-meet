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
    <div style={{ padding: "40px 20px", maxWidth: "800px", margin: "0 auto" }}>
      <StyledTitle>{t('ui_language')}</StyledTitle>
      
      <StyledCard>
        <Space direction="vertical" style={{ width: "100%" }}>
          <IconWrapper color={`${token.colorPrimary}15`} shadowColor={`${token.colorPrimary}20`}>
            <GlobalOutlined style={{ fontSize: "36px", color: token.colorPrimary }} />
          </IconWrapper>

          <Title level={4} style={{ textAlign: "center", margin: "16px 0", fontWeight: "600" }}>
            {t('select_ui_language')}
          </Title>

          <Text type="secondary" style={{
            display: "block",
            textAlign: "center",
            marginBottom: "32px",
            fontSize: "15px",
            lineHeight: "1.6"
          }}>
            {t('ui_language_desc') || 'Choose the language for the user interface of Smart Meet.'}
          </Text>

          <div style={{ textAlign: "center", marginBottom: "16px" }}>
            <UILanguageSelector />
          </div>
        </Space>
      </StyledCard>
    </div>
  );
};

export default UILanguageSettings; 