import React from 'react';
import { Typography, Card, Space, theme, Switch, Divider, Select } from 'antd';
import styled from '@emotion/styled';
import { TranslationOutlined } from '@ant-design/icons';
import LanguageSelector from './LanguageSelector';
import useI18n from '../utils/i18n';
import StyledTitle from './common/StyledTitle';
import { useAutoTranslate } from '../hooks/useAutoTranslate';
import { useTranslationProvider, getProviderDisplayName, type TranslationProvider } from '../hooks/useTranslationProvider';
import messageManager from '../utils/message-manager';

const { Title, Text } = Typography;
const { useToken } = theme;
const { Option } = Select;

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

const SwitchContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
`;

const TranslationSettings: React.FC = () => {
  const { token } = useToken();
  const { t } = useI18n();
  const [autoTranslateEnabled, setAutoTranslateEnabled] = useAutoTranslate();
  const [translationProvider, setTranslationProvider] = useTranslationProvider();

  const handleAutoTranslateChange = (checked: boolean) => {
    setAutoTranslateEnabled(checked);
    messageManager.success(
      checked ? t('auto_translate_enabled') : t('auto_translate_disabled')
    );
  };

  const handleProviderChange = (value: TranslationProvider) => {
    setTranslationProvider(value);
    const providerName = getProviderDisplayName(value);
    messageManager.success(
      t('translation_provider_set', { provider: providerName })
    );
  };

  return (
    <div style={{ padding: "40px 20px", maxWidth: "800px", margin: "0 auto" }}>
      <StyledTitle>{t('translation_language')}</StyledTitle>
      
      <StyledCard>
        <Space direction="vertical" style={{ width: "100%" }}>
          <IconWrapper color={`${token.colorSuccess}15`} shadowColor={`${token.colorSuccess}20`}>
            <TranslationOutlined style={{ fontSize: "36px", color: token.colorSuccess }} />
          </IconWrapper>

          <Title level={4} style={{ textAlign: "center", margin: "16px 0", fontWeight: "600" }}>
            {t('select_translation_language')}
          </Title>

          <Text type="secondary" style={{
            display: "block",
            textAlign: "center",
            marginBottom: "32px",
            fontSize: "15px",
            lineHeight: "1.6"
          }}>
            {t('translation_language_desc')}
          </Text>

          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <LanguageSelector />
          </div>

          <SwitchContainer>
            <div>
              <Text strong style={{ fontSize: "16px", marginBottom: "4px", display: "block" }}>
                {t('auto_translate')}
              </Text>
              <Text type="secondary" style={{ fontSize: "14px" }}>
                {t('auto_translate_desc')}
              </Text>
            </div>
            <Switch
              checked={autoTranslateEnabled}
              onChange={handleAutoTranslateChange}
              style={{ 
                backgroundColor: autoTranslateEnabled ? token.colorSuccess : undefined 
              }}
            />
          </SwitchContainer>

          {autoTranslateEnabled && (
            <>
              <Divider />

              <div style={{ padding: "16px 0" }}>
                <div style={{ marginBottom: "16px" }}>
                  <Text strong style={{ fontSize: "16px", marginBottom: "4px", display: "block" }}>
                    {t('translation_provider')}
                  </Text>
                  <Text type="secondary" style={{ fontSize: "14px" }}>
                    {t('translation_provider_desc')}
                  </Text>
                </div>
                <Select
                  value={translationProvider}
                  onChange={handleProviderChange}
                  style={{ width: "100%" }}
                  size="middle"
                >
                  <Option value="google">
                    {t('provider_google')}
                  </Option>
                  <Option value="microsoft">
                    {t('provider_microsoft')}
                  </Option>
                  <Option value="ai">
                    {t('provider_ai')}
                  </Option>
                </Select>
              </div>
            </>
          )}
        </Space>
      </StyledCard>
    </div>
  );
};

export default TranslationSettings; 