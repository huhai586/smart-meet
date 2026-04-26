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
} from '@ant-design/icons';
import styled from 'styled-components';
import { useI18n } from '../../utils/i18n';

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

/* ── Styled Components ── */

const PageWrapper = styled.div`
  padding: 0 20px;
  max-width: 800px;
  font-family: -apple-system, 'SF Pro Text', 'Helvetica Neue', 'Inter', sans-serif;
`;

const PageHeader = styled.div`
  padding: 0 0 24px;
`;

const PageTitle = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: #1C1C1E;
  letter-spacing: -0.5px;
  margin: 0 0 4px;
  font-family: -apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif;
`;

const PageSubtitle = styled.p`
  font-size: 13px;
  color: #8E8E93;
  margin: 0;
  line-height: 1.4;
`;

const SectionLabel = styled.div`
  font-size: 12px;
  font-weight: 500;
  color: #8E8E93;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  padding: 0 4px 8px;
`;

const SettingGroup = styled.div`
  background: #fff;
  border-radius: 12px;
  border: 0.5px solid rgba(60, 60, 67, 0.14);
  overflow: hidden;
  margin-bottom: 8px;
`;

const SettingRow = styled.div<{ $last?: boolean }>`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: #fff;
  border-bottom: ${({ $last }) => ($last ? 'none' : '0.5px solid rgba(60, 60, 67, 0.12)')};
  gap: 12px;
  transition: background 0.12s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.018);
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
  color: #1C1C1E;
  line-height: 1.3;
`;

const SectionFooter = styled.p`
  font-size: 12px;
  color: #8E8E93;
  padding: 6px 4px 20px;
  margin: 0;
  line-height: 1.5;
`;

const Section = styled.div`
  margin-bottom: 0;
`;

/* ── Component ── */

const SidepanelSettings: React.FC = () => {
  const { t } = useI18n();
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

  useEffect(() => {
    chrome.storage.local.get([SIDEPANEL_STORAGE_KEY, BUTTONS_STORAGE_KEY], (result) => {
      if (result[SIDEPANEL_STORAGE_KEY]) setVisibility(result[SIDEPANEL_STORAGE_KEY]);
      if (result[BUTTONS_STORAGE_KEY]) setButtonsVisibility(result[BUTTONS_STORAGE_KEY]);
    });
  }, []);

  const updateVisibility = (key: keyof SidepanelVisibility, value: boolean) => {
    const next = { ...visibility, [key]: value };
    setVisibility(next);
    chrome.storage.local.set({ [SIDEPANEL_STORAGE_KEY]: next });
  };

  const updateButtonsVisibility = (key: keyof CaptionButtonsVisibility, value: boolean) => {
    const next = { ...buttonsVisibility, [key]: value };
    setButtonsVisibility(next);
    chrome.storage.local.set({ [BUTTONS_STORAGE_KEY]: next });
  };

  const tabItems: { key: keyof SidepanelVisibility; icon: React.ReactNode; color: string; label: string }[] = [
    { key: 'captions',    icon: <FileDoneOutlined />,    color: '#007AFF', label: t('captions') },
    { key: 'summary',     icon: <SketchOutlined />,      color: '#5E5CE6', label: t('sidepanel_summary') },
    { key: 'translation', icon: <HistoryOutlined />,     color: '#007AFF', label: t('translation_records') },
    { key: 'longman',     icon: <BookOutlined />,        color: '#FF9500', label: t('longman_3000') },
  ];

  const buttonItems: { key: keyof CaptionButtonsVisibility; icon: React.ReactNode; color: string; label: string }[] = [
    { key: 'translate', icon: <TranslationOutlined />,  color: '#007AFF', label: t('translate') },
    { key: 'polish',    icon: <CheckCircleOutlined />,  color: '#34C759', label: t('polish') },
    { key: 'analysis',  icon: <CodeOutlined />,         color: '#5E5CE6', label: t('analysis') },
  ];

  return (
    <PageWrapper>
      <PageHeader>
        <PageTitle>{t('sidepanel_settings')}</PageTitle>
        <PageSubtitle>{t('sidepanel_settings_desc')}</PageSubtitle>
      </PageHeader>

      {/* Tab Visibility Group */}
      <Section>
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
      </Section>

      {/* Caption Buttons Group */}
      <Section>
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
      </Section>
    </PageWrapper>
  );
};

export default SidepanelSettings;
