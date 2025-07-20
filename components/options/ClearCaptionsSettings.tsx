import React, { useState } from 'react';
import { Typography, Card, Space, theme, Button, Modal, Alert } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import useI18n from '../../utils/i18n';
import StyledTitle from '../common/StyledTitle';
import '../../styles/clear-captions-settings.scss';

const { Title, Text } = Typography;
const { useToken } = theme;

const ClearCaptionsSettings: React.FC = () => {
  const { token } = useToken();
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

      <div className="clear-captions-settings-section">
        {/* Clear Captions Section */}
        <div className="clear-captions-main-section">

          <Alert
            message={t('warning')}
            description={t('clear_captions_warning')}
            type="warning"
            showIcon
            className="clear-captions-alert"
          />

          <div className="clear-captions-button-wrapper">
            <Button
              type="primary"
              danger
              size="large"
              icon={<DeleteOutlined />}
              onClick={showModal}
              className="clear-captions-button"
            >
              {t('clear_all_data')}
            </Button>
          </div>
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
              className="clear-captions-modal-alert"
              message={t('data_cleared_success')}
              type="success"
              showIcon
            />
          )}
        </Modal>
      </div>
    </div>
  );
};

export default ClearCaptionsSettings;
