import React, { useState } from 'react';
import { Typography, theme, Button, Modal, Alert, Card } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import useI18n from '~utils/i18n';
import StyledTitle from '~components/common/StyledTitle';
import '~styles/clear-captions-settings.scss';

const { Text } = Typography;
const { useToken } = theme;

const ClearCaptionsSettings: React.FC = () => {
  const { token: _token } = useToken();
  const { t } = useI18n();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [clearSuccess, setClearSuccess] = useState(false);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleClear = () => {
    // 清除全部字幕数据
    chrome.storage.local.set({ recordedContents: [] }, () => {
      chrome.runtime.sendMessage({ action: "clear" });
      setClearSuccess(true);
      setTimeout(() => {
        setClearSuccess(false);
        setIsModalVisible(false);
      }, 2000);
    });
  };

  return (
    <div>
      <StyledTitle subtitle={t('clear_captions_desc')}>{t('clear_captions')}</StyledTitle>

      <div style={{ padding: "0 20px" }}>
        <Card className="clear-captions-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <Text strong style={{ display: 'block', marginBottom: '4px' }}>
                {t('clear_captions_warning')}
              </Text>
              <Text type="secondary" style={{ display: 'block' }}>
                {t('clear_captions_warning_desc')}
              </Text>
            </div>

            <Button
              type="primary"
              danger
              size="large"
              icon={<DeleteOutlined />}
              onClick={showModal}
            >
              {t('clear_all_data')}
            </Button>
          </div>
        </Card>
      </div>

      <Modal
        title={t('confirm_clear_captions')}
        open={isModalVisible}
        onOk={handleClear}
        onCancel={handleCancel}
        okText={t('yes_clear_data')}
        cancelText={t('cancel')}
        okButtonProps={{ danger: true }}
      >
        <p>{t('clear_confirm')}</p>
        {clearSuccess && (
          <Alert
            message={t('data_cleared_success')}
            type="success"
            showIcon
          />
        )}
      </Modal>
    </div>
  );
};

export default ClearCaptionsSettings;
