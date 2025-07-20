import React from 'react';
import { Typography, Card, Space, theme, Switch, Divider, Select, Slider } from 'antd';
import LanguageSelector from '~components/LanguageSelector';
import useI18n from '~utils/i18n';
import StyledTitle from '~components/common/StyledTitle';
import { useAutoTranslate } from '~hooks/useAutoTranslate';
import { useTranslationProvider, getProviderDisplayName, type TranslationProvider } from '~hooks/useTranslationProvider';
import { useTranslationFrequency } from '~hooks/useTranslationFrequency';
import messageManager from '~utils/message-manager';
import '~styles/translation-settings.scss';

const { Title, Text } = Typography;
const { useToken } = theme;
const { Option } = Select;

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
          import('~hooks/useTranslationProvider').then(({ getCurrentTranslationProvider }) => {
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
    <div>
      <StyledTitle subtitle={t('translation_language_desc')}>{t('translation_language')}</StyledTitle>

      <div style={{ padding: "0 20px" }}>
        {/* Language Selector Section */}
        <div className="translation-settings-language-selector-section">

          <div className="translation-settings-language-selector-wrapper">
            <LanguageSelector />
          </div>
        </div>

        {/* Auto Translate Section */}
        <Card className="translation-settings-card">
          <Space direction="vertical" style={{ width: "100%" }}>
            <div className="translation-settings-switch-container">
              <div>
                <Text strong className="translation-settings-section-title">
                  {t('auto_translate')}
                </Text>
                <Text type="secondary" className="translation-settings-section-description">
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
            </div>

            {autoTranslateEnabled && (
              <>
                <Divider />

                <div className="translation-settings-provider-section">
                  <div className="translation-settings-provider-description-wrapper">
                    <Text strong className="translation-settings-section-title">
                      {t('translation_provider')}
                    </Text>
                    <Text type="secondary" className="translation-settings-section-description">
                      {t('translation_provider_desc')}
                    </Text>
                  </div>
                  <Select
                    value={translationProvider}
                    onChange={handleProviderChange}
                    className="translation-settings-provider-select"
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

                <div className="translation-settings-slider-container">
                  <div className="translation-settings-frequency-description-wrapper">
                    <Text strong className="translation-settings-section-title">
                      {t('translation_frequency')}
                    </Text>
                    <Text type="secondary" className="translation-settings-section-description">
                      {t('translation_frequency_desc')}
                    </Text>
                  </div>
                  <div className="translation-settings-frequency-slider-wrapper">
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
                      className="translation-settings-frequency-slider"
                    />
                    <div
                      className="translation-settings-frequency-label"
                      style={{
                        color: token.colorPrimary,
                      }}
                    >
                      {t('translation_frequency_label', { frequency: translationFrequency.toString() })}
                    </div>
                  </div>
                </div>
              </>
            )}
          </Space>
        </Card>
      </div>
    </div>
  );
};

export default TranslationSettings;
