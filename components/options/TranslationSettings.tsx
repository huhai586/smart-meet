import React, { useState } from 'react';
import { Switch, Slider, Modal, Form, Input, Select } from 'antd';
import { CheckOutlined, RightOutlined, GlobalOutlined, ApiOutlined, RobotOutlined, TranslationOutlined, ThunderboltOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import useI18n from '~utils/i18n';
import { useAutoTranslate } from '~hooks/useAutoTranslate';
import useCaptionWordTranslateToggle from '~hooks/useCaptionWordTranslateToggle';
import {
  useTranslationProvider,
  useDeepLConfig,
  useLocalTranslatorConfig,
  type TranslationProvider,
} from '~hooks/useTranslationProvider';
import { useLocalModelNeedsDownload } from '~hooks/useLocalModelNeedsDownload';
import { useTranslationFrequency } from '~hooks/useTranslationFrequency';
import { supportedLanguages, getLanguageDisplay } from '~utils/languages';
import useTranslationLanguage from '~hooks/useTranslationLanguage';
import messageManager from '~utils/message-manager';
import LocalTranslatorModal from './LocalTranslatorModal';
import { HoverDemo, HOVER_DEMO_KIND } from './HoverDemo';
import PageShell from '~components/options/PageShell';
import { OptionsRoute } from '~utils/options-routes';

/* ── Provider definitions ── */
interface ProviderItem {
  id: TranslationProvider;
  nameKey: string;
  icon: React.ReactNode;
  iconColor: string;
  hasSettings: boolean;
}

const PROVIDER_LIST: ProviderItem[] = [
  { id: 'google',    nameKey: 'provider_google',    icon: <GlobalOutlined />,      iconColor: '#4285F4', hasSettings: false },
  { id: 'microsoft', nameKey: 'provider_microsoft', icon: <ApiOutlined />,         iconColor: '#00A4EF', hasSettings: false },
  { id: 'ai',        nameKey: 'provider_ai',        icon: <RobotOutlined />,       iconColor: '#5E5CE6', hasSettings: false },
  { id: 'deepl',     nameKey: 'provider_deepl',     icon: <TranslationOutlined />, iconColor: '#0F2B46', hasSettings: true  },
  { id: 'local',     nameKey: 'provider_local',     icon: <ThunderboltOutlined />, iconColor: '#34C759', hasSettings: true  },
];

/* ── Styled Components ── */

const SectionLabel = styled.div`
  font-size: 12px;
  font-weight: 500;
  color: #8E8E93;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  padding: 0 4px 8px;
`;

const SettingGroup = styled.div`
  background: var(--opt-bg-card);
  border-radius: 12px;
  border: 0.5px solid var(--opt-border-subtle);
  overflow: hidden;
  margin-bottom: 8px;
`;

const SettingRow = styled.div<{ $last?: boolean; $clickable?: boolean }>`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: var(--opt-bg-card);
  border-bottom: ${({ $last }) => ($last ? 'none' : '0.5px solid var(--opt-border-divider)')};
  gap: 12px;
  transition: background 0.12s ease;
  cursor: ${({ $clickable }) => ($clickable ? 'pointer' : 'default')};

  &:hover {
    background: ${({ $clickable }) => ($clickable ? 'var(--opt-hover-clickable)' : 'var(--opt-hover-default)')};
  }
`;

const IconCircle = styled.div<{ $color: string }>`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: ${({ $color }) => $color};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #fff;
  font-size: 15px;
`;

const RowContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const RowTitle = styled.div`
  font-size: 15px;
  font-weight: 400;
  color: var(--opt-text-primary);
  line-height: 1.3;
`;

const RowSubtitle = styled.div`
  font-size: 12px;
  color: #8E8E93;
  margin-top: 2px;
  line-height: 1.4;
`;

const RowValue = styled.div`
  font-size: 15px;
  color: #8E8E93;
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
`;

const SliderRow = styled.div<{ $last?: boolean }>`
  padding: 14px 16px;
  background: var(--opt-bg-card);
  border-bottom: ${({ $last }) => ($last ? 'none' : '0.5px solid var(--opt-border-divider)')};
`;

const SliderLabel = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`;

const FrequencyValue = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: #007AFF;
`;

const SectionFooter = styled.p`
  font-size: 12px;
  color: #8E8E93;
  padding: 6px 4px 20px;
  margin: 0;
  line-height: 1.5;
`;

/* ── Component ── */

const TranslationSettings: React.FC = () => {
  const { t } = useI18n();
  const [language, setLanguage] = useTranslationLanguage();
  const [autoTranslateEnabled, setAutoTranslateEnabled] = useAutoTranslate();
  const [wordTranslateEnabled, setWordTranslateEnabled] = useCaptionWordTranslateToggle();
  const [translationProvider, setTranslationProvider] = useTranslationProvider();
  const [translationFrequency, setTranslationFrequency] = useTranslationFrequency();
  const [deepLConfig, setDeepLConfig] = useDeepLConfig();
  const [localConfig] = useLocalTranslatorConfig();
  const localNeedsDownload = useLocalModelNeedsDownload(
    translationProvider === 'local',
    localConfig.sourceLanguage || 'en',
    language.code,
  );

  const [deepLModalOpen, setDeepLModalOpen] = useState(false);
  const [deepLForm] = Form.useForm<{ auth_key: string }>();
  const [localModalOpen, setLocalModalOpen] = useState(false);

  const handleAutoTranslateChange = (checked: boolean) => {
    setAutoTranslateEnabled(checked);
    messageManager.success(checked ? t('auto_translate_enabled') : t('auto_translate_disabled'));
  };

  const handleWordTranslateChange = (checked: boolean) => {
    setWordTranslateEnabled(checked);
    messageManager.success(checked ? t('caption_word_translate_enabled') : t('caption_word_translate_disabled'));
  };

  const handleSelectProvider = (id: TranslationProvider) => {
    setTranslationProvider(id);
    messageManager.success(
      t('translation_provider_set', { provider: t(PROVIDER_LIST.find(p => p.id === id)?.nameKey ?? '') })
    );
  };

  const handleFrequencyChange = (value: number) => {
    setTranslationFrequency(value);
  };

  const openDeepLSettings = (e: React.MouseEvent) => {
    e.stopPropagation();
    deepLForm.setFieldsValue({ auth_key: deepLConfig.auth_key });
    setDeepLModalOpen(true);
  };

  const openLocalSettings = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLocalModalOpen(true);
  };

  const handleDeepLSave = () => {
    deepLForm.validateFields().then((values) => {
      setDeepLConfig({ auth_key: values.auth_key.trim() });
      setDeepLModalOpen(false);
      messageManager.success(t('deepl_settings_saved'));
    });
  };

  const currentLangDisplay = getLanguageDisplay(language);

  return (
    <PageShell route={OptionsRoute.TRANSLATION} subtitle={t('tab_translation_desc')}>

      {/* Section 1: General Settings */}
      <SectionLabel>{t('translation_target_language')}</SectionLabel>
      <SettingGroup>
        {/* Target Language — inline Select styled as a value row */}
        <SettingRow $last={false}>
          <RowContent>
            <RowTitle>{t('translation_target_language')}</RowTitle>
          </RowContent>
          <Select
            value={language.code}
            onChange={(value) => {
              const selected = supportedLanguages.find(l => l.code === value);
              if (selected) {
                setLanguage(selected);
                messageManager.success(t('translation_language_set', { language: selected.name }));
              }
            }}
            style={{
              width: 160,
              borderRadius: 8,
            }}
            variant="borderless"
            size="small"
          >
            {supportedLanguages.map(lang => (
              <Select.Option key={lang.code} value={lang.code}>
                {getLanguageDisplay(lang)}
              </Select.Option>
            ))}
          </Select>
        </SettingRow>

        {/* Click a word in Meet's native captions to translate it */}
        <SettingRow $last={false}>
          <RowContent>
            <RowTitle>
                {t('caption_word_translate')}{' '}
                <HoverDemo kind={HOVER_DEMO_KIND.WORD_CLICK}>
                  <QuestionCircleOutlined className="hover-demo__help" />
                </HoverDemo>
              </RowTitle>
            <RowSubtitle>{t('caption_word_translate_desc')}</RowSubtitle>
          </RowContent>
          <Switch checked={wordTranslateEnabled} onChange={handleWordTranslateChange} />
        </SettingRow>

        {/* Auto Translate */}
        <SettingRow $last={!autoTranslateEnabled}>
          <RowContent>
            <RowTitle>
                {t('auto_translate')}{' '}
                <HoverDemo kind={HOVER_DEMO_KIND.AUTO_TRANSLATE}>
                  <QuestionCircleOutlined className="hover-demo__help" />
                </HoverDemo>
              </RowTitle>
            <RowSubtitle>{t('auto_translate_desc')}</RowSubtitle>
          </RowContent>
          <Switch checked={autoTranslateEnabled} onChange={handleAutoTranslateChange} />
        </SettingRow>

        {/* Frequency Slider — only when auto-translate enabled */}
        {autoTranslateEnabled && (
          <SliderRow $last>
            <SliderLabel>
              <RowTitle style={{ fontSize: 14 }}>{t('translation_frequency')}</RowTitle>
              <FrequencyValue>
                {t('translation_frequency_label', { frequency: translationFrequency.toString() })}
              </FrequencyValue>
            </SliderLabel>
            <Slider
              min={1}
              max={10}
              step={0.5}
              value={translationFrequency}
              onChange={handleFrequencyChange}
              tooltip={{
                formatter: (v) => t('translation_frequency_label', { frequency: v?.toString() || '2.5' }),
              }}
              marks={{ 1: '1s', 2.5: '2.5s', 5: '5s', 10: '10s' }}
              style={{ margin: '4px 4px 20px' }}
            />
          </SliderRow>
        )}
      </SettingGroup>
      <SectionFooter>{t('translation_target_language_desc')}</SectionFooter>

      {/* Section 2: Translation Provider */}
      <SectionLabel>{t('translation_provider')}</SectionLabel>
      <SettingGroup>
        {PROVIDER_LIST.map((provider, idx) => {
          const isActive = translationProvider === provider.id;
          const isLast = idx === PROVIDER_LIST.length - 1;
          const openSettings = provider.id === 'local' ? openLocalSettings : openDeepLSettings;
          return (
            <SettingRow
              key={provider.id}
              $last={isLast}
              $clickable
              onClick={(e) => {
                handleSelectProvider(provider.id);
                if (provider.hasSettings) openSettings(e);
              }}
            >
              <IconCircle $color={provider.iconColor}>{provider.icon}</IconCircle>
              <RowContent>
                <RowTitle>{t(provider.nameKey)}</RowTitle>
                {provider.id === 'local' && isActive && localNeedsDownload && (
                  <RowSubtitle>{t('provider_local_download_hint')}</RowSubtitle>
                )}
              </RowContent>
              <RowValue>
                {isActive && <CheckOutlined style={{ color: '#007AFF', fontSize: 15, fontWeight: 700 }} />}
                {provider.hasSettings && (
                  <RightOutlined
                    style={{ color: '#C7C7CC', fontSize: 13, marginLeft: isActive ? 6 : 0 }}
                    onClick={openSettings}
                  />
                )}
              </RowValue>
            </SettingRow>
          );
        })}
      </SettingGroup>
      <SectionFooter>{t('translation_provider_desc')}</SectionFooter>

      {/* Local AI Translator Modal */}
      <LocalTranslatorModal
        open={localModalOpen}
        onClose={() => setLocalModalOpen(false)}
        onConfirm={() => {
          handleSelectProvider('local');
        }}
      />

      {/* DeepL Settings Modal */}
      <Modal
        title={t('deepl_settings')}
        open={deepLModalOpen}
        onOk={handleDeepLSave}
        onCancel={() => setDeepLModalOpen(false)}
        okText={t('save')}
        cancelText={t('cancel')}
        centered
        destroyOnClose
        styles={{
          content: { borderRadius: 14 },
        }}
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
    </PageShell>
  );
};

export default TranslationSettings;
