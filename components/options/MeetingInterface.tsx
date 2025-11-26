import React from 'react';
import { Typography, Card, Space, theme, Switch } from 'antd';
import { MessageOutlined, PushpinOutlined } from '@ant-design/icons';
import useI18n from '~utils/i18n';
import StyledTitle from '~components/common/StyledTitle';
import useCaptionToggle from '~hooks/useCaptionToggle';
import useStickerToggle from '~hooks/useStickerToggle';
import messageManager from '~utils/message-manager';
import '~styles/meeting-interface.scss';

const { Text } = Typography;
const { useToken } = theme;

const MeetingInterface: React.FC = () => {
  const { token } = useToken();
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

  return (
    <div>
      <StyledTitle subtitle={t('meeting_interface_desc')}>{t('meeting_interface')}</StyledTitle>

      <div style={{ padding: "0 20px" }}>
        {/* Caption Toggle Button Section */}
        <Card className="meeting-interface-card">
          <Space direction="vertical" style={{ width: "100%" }} size="large">
            <div className="meeting-interface-switch-container">
              <div className="meeting-interface-option-content">
                <div className="meeting-interface-option-header">
                  <MessageOutlined className="meeting-interface-option-icon" />
                  <Text strong className="meeting-interface-section-title">
                    {t('caption_toggle_button')}
                  </Text>
                </div>
                <Text type="secondary" className="meeting-interface-section-description">
                  {t('caption_toggle_button_desc')}
                </Text>
              </div>
              <Switch
                checked={captionToggleEnabled}
                onChange={handleCaptionToggleChange}
                style={{
                  backgroundColor: captionToggleEnabled ? token.colorSuccess : undefined
                }}
              />
            </div>

            {/* Sticker Note Section */}
            <div className="meeting-interface-switch-container">
              <div className="meeting-interface-option-content">
                <div className="meeting-interface-option-header">
                  <PushpinOutlined className="meeting-interface-option-icon" />
                  <Text strong className="meeting-interface-section-title">
                    {t('sticker_note')}
                  </Text>
                </div>
                <Text type="secondary" className="meeting-interface-section-description">
                  {t('sticker_note_desc')}
                </Text>
              </div>
              <Switch
                checked={stickerEnabled}
                onChange={handleStickerToggleChange}
                style={{
                  backgroundColor: stickerEnabled ? token.colorSuccess : undefined
                }}
              />
            </div>
          </Space>
        </Card>
      </div>
    </div>
  );
};

export default MeetingInterface;