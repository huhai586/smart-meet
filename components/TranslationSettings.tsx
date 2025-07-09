import React from 'react';
import { Typography, Card, Space, theme, Switch, Divider, Select, Slider } from 'antd';
import styled from '@emotion/styled';
import { TranslationOutlined } from '@ant-design/icons';
import LanguageSelector from './LanguageSelector';
import useI18n from '../utils/i18n';
import StyledTitle from './common/StyledTitle';
import { useAutoTranslate } from '../hooks/useAutoTranslate';
import { useTranslationProvider, getProviderDisplayName, type TranslationProvider } from '../hooks/useTranslationProvider';
import { useTranslationFrequency } from '../hooks/useTranslationFrequency';
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

const SliderContainer = styled.div`
  padding: 16px 0;
`;

const TranslationSettings: React.FC = () => {
  const { token } = useToken();
  const { t } = useI18n();
  const [autoTranslateEnabled, setAutoTranslateEnabled] = useAutoTranslate();
  const [translationProvider, setTranslationProvider] = useTranslationProvider();
  const [translationFrequency, setTranslationFrequency] = useTranslationFrequency();

  const handleAutoTranslateChange = (checked: boolean) => {
    setAutoTranslateEnabled(checked);
    messageManager.success(
      checked ? t('auto_translate_enabled') : t('auto_translate_disabled')
    );
  };

  const handleProviderChange = (value: TranslationProvider) => {
    console.log(`[TranslationSettings] User selected provider: ${value}`);
    
    // 在设置之前先检查当前存储的值
    chrome.storage.sync.get(['translationProvider'], (result) => {
      console.log(`[TranslationSettings] Before setting - Storage contains:`, result);
      
      // 设置新的翻译提供商
      setTranslationProvider(value);
      
      // 延迟验证设置是否成功
      setTimeout(() => {
        chrome.storage.sync.get(['translationProvider'], (newResult) => {
          console.log(`[TranslationSettings] After setting - Storage contains:`, newResult);
          
          // 再次测试获取函数
          import('../hooks/useTranslationProvider').then(({ getCurrentTranslationProvider }) => {
            getCurrentTranslationProvider().then(provider => {
              console.log(`[TranslationSettings] getCurrentTranslationProvider returned: ${provider}`);
            });
          });
        });
      }, 500);
    });
    
    const providerName = getProviderDisplayName(value);
    messageManager.success(
      t('translation_provider_set', { provider: providerName })
    );
  };

  const handleFrequencyChange = (value: number) => {
    setTranslationFrequency(value);
    messageManager.success(
      t('translation_frequency_set', { frequency: value.toString() })
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

              <Divider />

              <SliderContainer>
                <div style={{ marginBottom: "16px" }}>
                  <Text strong style={{ fontSize: "16px", marginBottom: "4px", display: "block" }}>
                    {t('translation_frequency')}
                  </Text>
                  <Text type="secondary" style={{ fontSize: "14px", marginBottom: "16px" }}>
                    {t('translation_frequency_desc')}
                  </Text>
                </div>
                <div style={{ paddingLeft: "8px", paddingRight: "8px" }}>
                  <Slider
                    min={1}
                    max={10}
                    step={0.5}
                    value={translationFrequency}
                    onChange={handleFrequencyChange}
                    tooltip={{
                      formatter: (value) => t('translation_frequency_label', { frequency: value?.toString() || '2.5' })
                    }}
                    marks={{
                      1: '1s',
                      2.5: '2.5s',
                      5: '5s',
                      10: '10s'
                    }}
                    style={{ width: "100%" }}
                  />
                  <div style={{ 
                    textAlign: "center", 
                    marginTop: "8px", 
                    fontSize: "14px",
                    color: token.colorPrimary,
                    fontWeight: "500"
                  }}>
                    {t('translation_frequency_label', { frequency: translationFrequency.toString() })}
                  </div>
                </div>
              </SliderContainer>
            </>
          )}
        </Space>
      </StyledCard>
    </div>
  );
};

export default TranslationSettings; 