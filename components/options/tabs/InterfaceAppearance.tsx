import React, { useEffect, useState } from 'react';
import { Switch } from 'antd';
import {
  FileDoneOutlined,
  SketchOutlined,
  HistoryOutlined,
  TranslationOutlined,
  CheckCircleOutlined,
  CodeOutlined,
  BookOutlined,
  MessageOutlined,
  PushpinOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import styled from 'styled-components';
import { useI18n } from '~/utils/i18n';
import { getConfigValue, setConfigValue } from '~/utils/appConfig';
import useCaptionToggle from '~/hooks/useCaptionToggle';
import useStickerToggle from '~/hooks/useStickerToggle';
import messageManager from '~/utils/message-manager';
import { HoverDemo, HOVER_DEMO_KIND } from '../HoverDemo';
import PageShell from '~components/options/PageShell';
import { OptionsRoute } from '~utils/options-routes';

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
    background: ${({ $clickable }) =>
      $clickable ? 'var(--opt-hover-clickable)' : 'var(--opt-hover-default)'};
  }
`;

const IconSquircle = styled.div<{ $color: string }>`
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

const SectionFooter = styled.p`
  font-size: 12px;
  color: #8E8E93;
  padding: 6px 4px 20px;
  margin: 0;
  line-height: 1.5;
`;

/* ── Types ── */
interface SidepanelVisibility {
  captions: boolean;
  summary: boolean;
  translation: boolean;
  longman: boolean;
}

interface CaptionButtonsVisibility {
  translate: boolean;
  polish: boolean;
  analysis: boolean;
}

const SIDEPANEL_STORAGE_KEY = 'sidepanelVisibility';
const BUTTONS_STORAGE_KEY = 'captionButtonsVisibility';

/* ── Component ── */

const InterfaceAppearance: React.FC = () => {
  const { t } = useI18n();

  /* Sidepanel visibility */
  const [visibility, setVisibility] = useState<SidepanelVisibility>({
    captions: true,
    summary: true,
    translation: true,
    longman: false,
  });
  const [buttonsVisibility, setButtonsVisibility] = useState<CaptionButtonsVisibility>({
    translate: true,
    polish: true,
    analysis: true,
  });

  /* Meeting overlay */
  const [captionToggleEnabled, setCaptionToggleEnabled] = useCaptionToggle();
  const [stickerEnabled, setStickerEnabled] = useStickerToggle();

  useEffect(() => {
    Promise.all([
      getConfigValue('sidepanelVisibility'),
      getConfigValue('captionButtonsVisibility'),
  ]).then(([sv, bv]) => {
      if (sv) setVisibility(sv);
      if (bv) setButtonsVisibility(bv);
    });
  }, []);

  const updateVisibility = (key: keyof SidepanelVisibility, value: boolean) => {
    const next = { ...visibility, [key]: value };
    setVisibility(next);
    setConfigValue('sidepanelVisibility', next);
  };

  const updateButtonsVisibility = (key: keyof CaptionButtonsVisibility, value: boolean) => {
    const next = { ...buttonsVisibility, [key]: value };
    setButtonsVisibility(next);
    setConfigValue('captionButtonsVisibility', next);
  };

  const handleCaptionToggleChange = (checked: boolean) => {
    setCaptionToggleEnabled(checked);
    messageManager.success(
      checked ? t('caption_toggle_enabled') : t('caption_toggle_disabled'),
    );
  };

  const handleStickerToggleChange = (checked: boolean) => {
    setStickerEnabled(checked);
    messageManager.success(checked ? t('sticker_enabled') : t('sticker_disabled'));
  };

  const tabItems: {
    key: keyof SidepanelVisibility;
    icon: React.ReactNode;
    color: string;
    label: string;
  }[] = [
    { key: 'captions', icon: <FileDoneOutlined />, color: '#007AFF', label: t('captions') },
    { key: 'summary', icon: <SketchOutlined />, color: '#5E5CE6', label: t('sidepanel_summary') },
    {
      key: 'translation',
      icon: <HistoryOutlined />,
      color: '#007AFF',
      label: t('translation_records'),
    },
    { key: 'longman', icon: <BookOutlined />, color: '#FF9500', label: t('longman_3000') },
  ];

  const buttonItems: {
    key: keyof CaptionButtonsVisibility;
    icon: React.ReactNode;
    color: string;
    label: string;
  }[] = [
    {
      key: 'translate',
      icon: <TranslationOutlined />,
      color: '#007AFF',
      label: t('translate'),
    },
    { key: 'polish', icon: <CheckCircleOutlined />, color: '#34C759', label: t('polish') },
    { key: 'analysis', icon: <CodeOutlined />, color: '#5E5CE6', label: t('analysis') },
  ];

  return (
    <PageShell route={OptionsRoute.INTERFACE} subtitle={t('tab_visibility_desc')}>

      {/* Sidepanel Tab Visibility */}
      <SectionLabel>{t('sidepanel_visibility_settings')}</SectionLabel>
      <SettingGroup>
        {tabItems.map((item, idx) => (
          <SettingRow key={item.key} $last={idx === tabItems.length - 1}>
            <IconSquircle $color={item.color}>{item.icon}</IconSquircle>
            <RowContent>
              <RowTitle>{item.label}</RowTitle>
            </RowContent>
            <Switch
              checked={visibility[item.key]}
              onChange={(checked) => updateVisibility(item.key, checked)}
            />
          </SettingRow>
        ))}
      </SettingGroup>
      <SectionFooter>{t('sidepanel_visibility_desc')}</SectionFooter>

      {/* Caption Action Buttons */}
      <SectionLabel>{t('caption_buttons_visibility_settings')}</SectionLabel>
      <SettingGroup>
        {buttonItems.map((item, idx) => (
          <SettingRow key={item.key} $last={idx === buttonItems.length - 1}>
            <IconSquircle $color={item.color}>{item.icon}</IconSquircle>
            <RowContent>
              <RowTitle>{item.label}</RowTitle>
            </RowContent>
            <Switch
              checked={buttonsVisibility[item.key]}
              onChange={(checked) => updateButtonsVisibility(item.key, checked)}
            />
          </SettingRow>
        ))}
      </SettingGroup>
      <SectionFooter>{t('caption_buttons_visibility_desc')}</SectionFooter>

      {/* Meeting Overlay */}
      <SectionLabel>{t('meeting_interface')}</SectionLabel>
      <SettingGroup>
        <SettingRow>
          <IconSquircle $color="#007AFF">
            <MessageOutlined />
          </IconSquircle>
          <RowContent>
            <RowTitle>
              {t('caption_toggle_button')}{' '}
              <HoverDemo kind={HOVER_DEMO_KIND.CAPTION_TOGGLE}>
                <QuestionCircleOutlined className="hover-demo__help" />
              </HoverDemo>
            </RowTitle>
            <RowSubtitle>{t('caption_toggle_button_desc')}</RowSubtitle>
          </RowContent>
          <Switch checked={captionToggleEnabled} onChange={handleCaptionToggleChange} />
        </SettingRow>
        <SettingRow $last>
          <IconSquircle $color="#FF9500">
            <PushpinOutlined />
          </IconSquircle>
          <RowContent>
            <RowTitle>
              {t('sticker_note')}{' '}
              <HoverDemo kind={HOVER_DEMO_KIND.STICKER}>
                <QuestionCircleOutlined className="hover-demo__help" />
              </HoverDemo>
            </RowTitle>
            <RowSubtitle>{t('sticker_note_desc')}</RowSubtitle>
          </RowContent>
          <Switch checked={stickerEnabled} onChange={handleStickerToggleChange} />
        </SettingRow>
      </SettingGroup>
      <SectionFooter>{t('meeting_interface_desc')}</SectionFooter>
    </PageShell>
  );
};

export default InterfaceAppearance;
