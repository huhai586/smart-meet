import React from 'react';
import { Switch } from 'antd';
import { MessageOutlined, PushpinOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import useI18n from '~utils/i18n';
import useCaptionToggle from '~hooks/useCaptionToggle';
import useStickerToggle from '~hooks/useStickerToggle';
import messageManager from '~utils/message-manager';

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

/* ── Component ── */

const MeetingInterface: React.FC = () => {
  const { t } = useI18n();
  const [captionToggleEnabled, setCaptionToggleEnabled] = useCaptionToggle();
  const [stickerEnabled, setStickerEnabled] = useStickerToggle();

  const handleCaptionToggleChange = (checked: boolean) => {
    setCaptionToggleEnabled(checked);
    messageManager.success(
      checked ? t('caption_toggle_enabled') : t('caption_toggle_disabled')
    );
  };

  const handleStickerToggleChange = (checked: boolean) => {
    setStickerEnabled(checked);
    messageManager.success(
      checked ? t('sticker_enabled') : t('sticker_disabled')
    );
  };

  const items = [
    {
      icon: <MessageOutlined />,
      color: '#007AFF',
      label: t('caption_toggle_button'),
      desc: t('caption_toggle_button_desc'),
      checked: captionToggleEnabled,
      onChange: handleCaptionToggleChange,
    },
    {
      icon: <PushpinOutlined />,
      color: '#FF9500',
      label: t('sticker_note'),
      desc: t('sticker_note_desc'),
      checked: stickerEnabled,
      onChange: handleStickerToggleChange,
    },
  ];

  return (
    <PageWrapper>
      <PageHeader>
        <PageTitle>{t('meeting_interface')}</PageTitle>
        <PageSubtitle>{t('meeting_interface_desc')}</PageSubtitle>
      </PageHeader>

      <SectionLabel>{t('meeting_interface')}</SectionLabel>
      <SettingGroup>
        {items.map((item, idx) => (
          <SettingRow key={item.label} $last={idx === items.length - 1}>
            <IconSquircle $color={item.color}>{item.icon}</IconSquircle>
            <RowContent>
              <RowTitle>{item.label}</RowTitle>
            </RowContent>
            <Switch checked={item.checked} onChange={item.onChange} />
          </SettingRow>
        ))}
      </SettingGroup>
      <SectionFooter>{t('meeting_interface_desc')}</SectionFooter>
    </PageWrapper>
  );
};

export default MeetingInterface;
