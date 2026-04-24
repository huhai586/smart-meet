import React, { useState } from 'react';
import { Typography, Card, Space, theme, Switch, Divider, Slider, Modal, Form, Input, Button, Tooltip } from 'antd';
import { CheckOutlined, SettingOutlined } from '@ant-design/icons';
import LanguageSelector from '~components/options/LanguageSelector';
import useI18n from '~utils/i18n';
import StyledTitle from '~components/common/StyledTitle';
import { useAutoTranslate } from '~hooks/useAutoTranslate';
import {
  useTranslationProvider,
  useDeepLConfig,
  type TranslationProvider,
} from '~hooks/useTranslationProvider';
import { useTranslationFrequency } from '~hooks/useTranslationFrequency';
import messageManager from '~utils/message-manager';
import '~styles/translation-settings.scss';

const { Text } = Typography;
const { useToken } = theme;

interface ProviderItem {
  id: TranslationProvider;
  nameKey: string;
  descKey: string;
  hasSettings: boolean;
}

const PROVIDER_LIST: ProviderItem[] = [
  { id: 'google',    nameKey: 'provider_google',    descKey: 'provider_google_desc',    hasSettings: false },
  { id: 'microsoft', nameKey: 'provider_microsoft', descKey: 'provider_microsoft_desc', hasSettings: false },
  { id: 'ai',        nameKey: 'provider_ai',        descKey: 'provider_ai_desc',        hasSettings: false },
  { id: 'deepl',     nameKey: 'provider_deepl',     descKey: 'provider_deepl_desc',     hasSettings: true  },
];

const TranslationSettings: React.FC = () => {
  const { token } = useToken();
  const { t } = useI18n();
  const [autoTranslateEnabled, setAutoTranslateEnabled] = useAutoTranslate();
  const [translationProvider, setTranslationProvider] = useTranslationProvider();
  const [translationFrequency, setTranslationFrequency] = useTranslationFrequency();
  const [deepLConfig, setDeepLConfig] = useDeepLConfig();

  const [deepLModalOpen, setDeepLModalOpen] = useState(false);
  const [deepLForm] = Form.useForm<{ auth_key: string }>();

  const handleAutoTranslateChange = (checked: boolean) => {
    setAutoTranslateEnabled(checked);
    messageManager.success(
      checked ? t('auto_translate_enabled') : t('auto_translate_disabled')
    );
  };

  const handleSelectProvider = (id: TranslationProvider) => {
    setTranslationProvider(id);
    messageManager.success(t('translation_provider_set', { provider: t(PROVIDER_LIST.find(p => p.id === id)?.nameKey ?? '') }));
  };

  const handleFrequencyChange = (value: number) => {
    setTranslationFrequency(value);
    messageManager.success(
      t('translation_frequency_set', { frequency: value.toString() })
    );
  };

  const openDeepLSettings = (e: React.MouseEvent) => {
    e.stopPropagation();
    deepLForm.setFieldsValue({ auth_key: deepLConfig.auth_key });
    setDeepLModalOpen(true);
  };

  const handleDeepLSave = () => {
    deepLForm.validateFields().then((values) => {
      setDeepLConfig({ auth_key: values.auth_key.trim() });
      setDeepLModalOpen(false);
      messageManager.success(t('deepl_settings_saved'));
    });
  };

  return (
    <div>
      <StyledTitle subtitle={t('translation_language_desc')}>{t('translation_language')}</StyledTitle>

      <div style={{ padding: '0 20px' }}>
        <Card className="translation-settings-card">
          <Space direction="vertical" style={{ width: '100%' }}>
            {/* Language Selector Section */}
            <div>
              <Text strong className="translation-settings-section-title">
                {t('translation_target_language')}
              </Text>
              <Text type="secondary" className="translation-settings-section-description">
                {t('translation_target_language_desc')}
              </Text>
            </div>
            <div className="translation-settings-language-selector-wrapper">
              <LanguageSelector />
            </div>

            <Divider />

            {/* Auto Translate Section */}
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
                style={{ backgroundColor: autoTranslateEnabled ? token.colorSuccess : undefined }}
              />
            </div>

            {/* Translation Frequency - only when auto-translate is on */}
            {autoTranslateEnabled && (
              <>
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
                        formatter: (value) =>
                          t('translation_frequency_label', { frequency: value?.toString() || '2.5' }),
                      }}
                      marks={{ 1: '1s', 2.5: '2.5s', 5: '5s', 10: '10s' }}
                      className="translation-settings-frequency-slider"
                    />
                    <div
                      className="translation-settings-frequency-label"
                      style={{ color: token.colorPrimary }}
                    >
                      {t('translation_frequency_label', { frequency: translationFrequency.toString() })}
                    </div>
                  </div>
                </div>
              </>
            )}

            <Divider />

            {/* Translation Provider List */}
            <div className="translation-settings-provider-section">
              <div className="translation-settings-provider-description-wrapper">
                <Text strong className="translation-settings-section-title">
                  {t('translation_provider')}
                </Text>
                <Text type="secondary" className="translation-settings-section-description">
                  {t('translation_provider_desc')}
                </Text>
              </div>

              <div className="translation-provider-list">
                {PROVIDER_LIST.map((provider) => {
                  const isActive = translationProvider === provider.id;
                  return (
                    <div
                      key={provider.id}
                      className={`translation-provider-item${isActive ? ' translation-provider-item--active' : ''}`}
                      onClick={() => handleSelectProvider(provider.id)}
                      style={{
                        borderColor: isActive ? token.colorPrimary : token.colorBorderSecondary,
                        backgroundColor: isActive ? token.colorPrimaryBg : token.colorBgContainer,
                      }}
                    >
                      <div className="translation-provider-item__check">
                        {isActive && (
                          <CheckOutlined style={{ color: token.colorPrimary, fontSize: 14 }} />
                        )}
                      </div>

                      <div className="translation-provider-item__info">
                        <Text strong style={{ color: isActive ? token.colorPrimary : token.colorText }}>
                          {t(provider.nameKey)}
                        </Text>
                        <Text type="secondary" className="translation-provider-item__desc">
                          {t(provider.descKey)}
                        </Text>
                      </div>

                      {provider.hasSettings && (
                        <Tooltip title={t('deepl_settings')}>
                          <Button
                            type="text"
                            size="small"
                            icon={<SettingOutlined />}
                            className="translation-provider-item__settings-btn"
                            onClick={openDeepLSettings}
                          />
                        </Tooltip>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </Space>
        </Card>
      </div>

      {/* DeepL Settings Modal */}
      <Modal
        title={t('deepl_settings')}
        open={deepLModalOpen}
        onOk={handleDeepLSave}
        onCancel={() => setDeepLModalOpen(false)}
        okText={t('save')}
        cancelText={t('cancel')}
        destroyOnClose
      >
        <Form form={deepLForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="auth_key"
            label={t('deepl_auth_key')}
            rules={[{ required: true, message: t('deepl_auth_key_required') }]}
            extra={
              <a href="https://www.deepl.com/pro#developer" target="_blank" rel="noopener noreferrer">
                {t('deepl_auth_key_help')}
              </a>
            }
          >
            <Input.Password placeholder={t('deepl_auth_key_placeholder')} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TranslationSettings;
