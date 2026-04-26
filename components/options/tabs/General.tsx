import React, { useEffect, useState } from 'react';
import { Modal, Alert } from 'antd';
import {
  GlobalOutlined,
  FontSizeOutlined,
  QuestionCircleOutlined,
  DeleteOutlined,
  MinusOutlined,
  PlusOutlined,
  RightOutlined,
} from '@ant-design/icons';
import styled from 'styled-components';
import { useI18n } from '~/utils/i18n';
import UILanguageSelector from '~/components/options/UILanguageSelector';
import { sendBackgroundMessage } from '~/background/message-center';

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

const SectionLabel = styled.div<{ $danger?: boolean }>`
  font-size: 12px;
  font-weight: 500;
  color: ${({ $danger }) => ($danger ? '#FF3B30' : '#8E8E93')};
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

const SettingRow = styled.div<{ $last?: boolean; $clickable?: boolean; $danger?: boolean }>`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: #fff;
  border-bottom: ${({ $last }) => ($last ? 'none' : '0.5px solid rgba(60, 60, 67, 0.12)')};
  gap: 12px;
  transition: background 0.12s ease;
  cursor: ${({ $clickable }) => ($clickable ? 'pointer' : 'default')};

  &:hover {
    background: ${({ $clickable }) =>
      $clickable ? 'rgba(0, 0, 0, 0.03)' : 'rgba(0, 0, 0, 0.018)'};
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

const RowTitle = styled.div<{ $danger?: boolean }>`
  font-size: 15px;
  font-weight: 400;
  color: ${({ $danger }) => ($danger ? '#FF3B30' : '#1C1C1E')};
  line-height: 1.3;
`;

const RowSubtitle = styled.div`
  font-size: 12px;
  color: #8E8E93;
  margin-top: 2px;
  line-height: 1.4;
`;

const SectionFooter = styled.p`
  font-size: 12px;
  color: #8E8E93;
  padding: 6px 4px 20px;
  margin: 0;
  line-height: 1.5;
`;

const Chevron = styled(RightOutlined)`
  font-size: 12px;
  color: #C7C7CC;
`;

/* ── Stepper ── */
const StepperWrap = styled.div`
  display: flex;
  align-items: center;
  border: 0.5px solid rgba(60, 60, 67, 0.3);
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
`;

const StepperBtn = styled.button<{ $disabled?: boolean }>`
  width: 32px;
  height: 28px;
  background: none;
  border: none;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: ${({ $disabled }) => ($disabled ? '#C7C7CC' : '#007AFF')};
  transition: background 0.1s ease;

  &:hover:not(:disabled) {
    background: rgba(0, 122, 255, 0.08);
  }
`;

const StepperValue = styled.div`
  padding: 0 10px;
  font-size: 14px;
  font-weight: 500;
  color: #1C1C1E;
  min-width: 46px;
  text-align: center;
  border-left: 0.5px solid rgba(60, 60, 67, 0.2);
  border-right: 0.5px solid rgba(60, 60, 67, 0.2);
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Stepper: React.FC<{
  value: number;
  min: number;
  max: number;
  base: number;
  onChange: (v: number) => void;
}> = ({ value, min, max, base, onChange }) => (
  <StepperWrap>
    <StepperBtn $disabled={value <= min} onClick={() => value > min && onChange(value - 1)}>
      <MinusOutlined />
    </StepperBtn>
    <StepperValue>{base + value}px</StepperValue>
    <StepperBtn $disabled={value >= max} onClick={() => value < max && onChange(value + 1)}>
      <PlusOutlined />
    </StepperBtn>
  </StepperWrap>
);

/* ── Component ── */

const General: React.FC = () => {
  const { t } = useI18n();

  const [captionFontOffset, setCaptionFontOffset] = useState(0);
  const [summaryFontOffset, setSummaryFontOffset] = useState(0);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [clearSuccess, setClearSuccess] = useState(false);

  useEffect(() => {
    chrome.storage.local.get(['captionFontSizeOffset', 'summaryFontSizeOffset'], (result) => {
      setCaptionFontOffset(result.captionFontSizeOffset ?? 0);
      setSummaryFontOffset(result.summaryFontSizeOffset ?? 0);
    });
  }, []);

  const handleCaptionFont = (next: number) => {
    setCaptionFontOffset(next);
    chrome.storage.local.set({ captionFontSizeOffset: next });
  };

  const handleSummaryFont = (next: number) => {
    setSummaryFontOffset(next);
    chrome.storage.local.set({ summaryFontSizeOffset: next });
  };

  const handleClear = () => {
    chrome.storage.local.set({ recordedContents: [] }, () => {
      sendBackgroundMessage({ action: 'clear' });
      setClearSuccess(true);
      setTimeout(() => {
        setClearSuccess(false);
        setIsModalVisible(false);
      }, 2000);
    });
  };

  return (
    <PageWrapper>
      <PageHeader>
        <PageTitle>{t('tab_general')}</PageTitle>
        <PageSubtitle>{t('tab_general_desc')}</PageSubtitle>
      </PageHeader>

      {/* Language */}
      <SectionLabel>{t('ui_language')}</SectionLabel>
      <SettingGroup>
        <SettingRow $last>
          <IconSquircle $color="#007AFF">
            <GlobalOutlined />
          </IconSquircle>
          <RowContent>
            <RowTitle>{t('select_ui_language')}</RowTitle>
          </RowContent>
          <UILanguageSelector compact />
        </SettingRow>
      </SettingGroup>
      <SectionFooter>{t('ui_language_selector_desc')}</SectionFooter>

      {/* Font Size */}
      <SectionLabel>{t('font_size_control')}</SectionLabel>
      <SettingGroup>
        <SettingRow>
          <IconSquircle $color="#007AFF">
            <FontSizeOutlined />
          </IconSquircle>
          <RowContent>
            <RowTitle>{t('captions_font_size')}</RowTitle>
          </RowContent>
          <Stepper value={captionFontOffset} min={-6} max={10} base={16} onChange={handleCaptionFont} />
        </SettingRow>
        <SettingRow $last>
          <IconSquircle $color="#5E5CE6">
            <FontSizeOutlined />
          </IconSquircle>
          <RowContent>
            <RowTitle>{t('summary_font_size')}</RowTitle>
          </RowContent>
          <Stepper value={summaryFontOffset} min={-6} max={10} base={13} onChange={handleSummaryFont} />
        </SettingRow>
      </SettingGroup>
      <SectionFooter>{t('font_size_control_desc')}</SectionFooter>

      {/* Help & Guide */}
      <SectionLabel>{t('help_and_guide')}</SectionLabel>
      <SettingGroup>
        <SettingRow
          $last
          $clickable
          onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL('options.html#welcome') })}
        >
          <IconSquircle $color="#007AFF">
            <QuestionCircleOutlined />
          </IconSquircle>
          <RowContent>
            <RowTitle>{t('open_welcome_guide')}</RowTitle>
          </RowContent>
          <Chevron />
        </SettingRow>
      </SettingGroup>

      {/* Data Management – danger zone */}
      <SectionLabel $danger>{t('data_management')}</SectionLabel>
      <SettingGroup>
        <SettingRow $last $clickable onClick={() => setIsModalVisible(true)}>
          <IconSquircle $color="#FF3B30">
            <DeleteOutlined />
          </IconSquircle>
          <RowContent>
            <RowTitle $danger>{t('clear_all_data')}</RowTitle>
            <RowSubtitle>{t('clear_captions_warning_desc')}</RowSubtitle>
          </RowContent>
          <Chevron />
        </SettingRow>
      </SettingGroup>

      <Modal
        title={t('confirm_clear_captions')}
        open={isModalVisible}
        onOk={handleClear}
        onCancel={() => setIsModalVisible(false)}
        okText={t('yes_clear_data')}
        cancelText={t('cancel')}
        okButtonProps={{ danger: true }}
        centered
      >
        <p>{t('clear_confirm')}</p>
        {clearSuccess && (
          <Alert message={t('data_cleared_success')} type="success" showIcon />
        )}
      </Modal>
    </PageWrapper>
  );
};

export default General;
