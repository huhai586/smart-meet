import React, { useState } from 'react';
import { Switch, Slider, Modal, Form, Input, Select } from 'antd';
import { ArrowRightOutlined, CheckOutlined, RightOutlined, GlobalOutlined, ApiOutlined, RobotOutlined, TranslationOutlined, ThunderboltOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import useI18n from '~utils/i18n';
import { useAutoTranslate } from '~hooks/useAutoTranslate';
import useCaptionWordTranslateToggle from '~hooks/useCaptionWordTranslateToggle';
import {
  useTranslationProvider,
  useDeepLConfig,
  type TranslationProvider,
} from '~hooks/useTranslationProvider';
import {
  effectiveMeetingLanguage,
  languageNativeName,
  useMeetingLanguage,
  useResolvedMeetingLanguage,
} from '~hooks/useMeetingLanguage';
import { MEETING_LANGUAGE_AUTO } from '~utils/meeting-language';
import { useLocalModelNeedsDownload } from '~hooks/useLocalModelNeedsDownload';
import { useTranslationFrequency } from '~hooks/useTranslationFrequency';
import { supportedLanguages, getLanguageDisplay, getLanguageByCode } from '~utils/languages';
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

/** Meeting language → translate to: the source and the target of every translation, side by side. */
const LanguagePair = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 24px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: var(--opt-bg-card);
  border-radius: 12px;
  border: 0.5px solid var(--opt-border-subtle);
`;

/** One side of the pair: a quiet tile with its label on top and the language below. */
const LanguageField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
  padding: 8px 12px 6px;
  border-radius: 10px;
  background: var(--opt-bg-page);
  transition: background 0.18s ease;

  &:hover {
    background: var(--opt-segment-bg);
  }

  /* The select is the tile's value line: no box of its own, aligned with the label. */
  .ant-select {
    width: 100%;
  }
  .ant-select .ant-select-selector {
    padding-inline: 0 !important;
  }
  .ant-select .ant-select-selection-item {
    font-size: 15px;
    font-weight: 500;
    color: var(--opt-text-primary);
  }
`;

const LanguageFieldLabel = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: var(--opt-text-secondary);
`;

const PairArrow = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 12px;
  background: rgba(26, 115, 232, 0.12);
  color: #1a73e8;
  font-size: 11px;
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
  const [meetingLanguage, setMeetingLanguage] = useMeetingLanguage();
  const resolvedMeetingLanguage = useResolvedMeetingLanguage();
  const localNeedsDownload = useLocalModelNeedsDownload(
    translationProvider === 'local',
    effectiveMeetingLanguage(meetingLanguage, resolvedMeetingLanguage),
    language.code,
  );

  // Auto mode shows what it settled on, the way the popup does.
  const meetingLanguageLabel = meetingLanguage !== MEETING_LANGUAGE_AUTO
    ? getLanguageDisplay(getLanguageByCode(meetingLanguage))
    : resolvedMeetingLanguage
      ? t('meeting_language_auto_value', { language: languageNativeName(resolvedMeetingLanguage.language) })
      : t('meeting_language_auto');

  const handleMeetingLanguageChange = (value: string) => {
    setMeetingLanguage(value);
    const selected = supportedLanguages.find((l) => l.code === value);
    messageManager.success(t('meeting_language_set', {
      language: selected ? getLanguageDisplay(selected) : t('meeting_language_auto'),
    }));
  };

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

      {/* Section 1: Languages */}
      <SectionLabel>{t('translation_languages')}</SectionLabel>
      <LanguagePair>
        <LanguageField>
          <LanguageFieldLabel>{t('meeting_language')}</LanguageFieldLabel>
          <Select
            variant="borderless"
            aria-label={t('meeting_language')}
            value={meetingLanguage}
            onChange={handleMeetingLanguageChange}
            labelRender={() => meetingLanguageLabel}
            popupMatchSelectWidth={false}
            options={[
              { value: MEETING_LANGUAGE_AUTO, label: t('meeting_language_auto') },
              ...supportedLanguages.map((lang) => ({ value: lang.code, label: getLanguageDisplay(lang) })),
            ]}
          />
        </LanguageField>
        <PairArrow aria-hidden><ArrowRightOutlined /></PairArrow>
        <LanguageField>
          <LanguageFieldLabel>{t('translate_to')}</LanguageFieldLabel>
          <Select
            variant="borderless"
            aria-label={t('translate_to')}
            value={language.code}
            onChange={(value) => {
              const selected = supportedLanguages.find(l => l.code === value);
              if (selected) {
                setLanguage(selected);
                messageManager.success(t('translation_language_set', { language: selected.name }));
              }
            }}
            popupMatchSelectWidth={false}
            options={supportedLanguages.map((lang) => ({ value: lang.code, label: getLanguageDisplay(lang) }))}
          />
        </LanguageField>
      </LanguagePair>
      <SectionFooter>{t('translation_languages_desc')}</SectionFooter>

      {/* Section 2: How captions get translated */}
      <SectionLabel>{t('translation_behavior')}</SectionLabel>
      <SettingGroup style={{ marginBottom: 28 }}>
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

      {/* Section 3: Translation Provider */}
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
