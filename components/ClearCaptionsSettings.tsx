import React, { useState } from 'react';
import { Typography, Card, Space, theme, Button, Modal, Alert } from 'antd';
import styled from '@emotion/styled';
import { DeleteOutlined } from '@ant-design/icons';
import useI18n from '../utils/i18n';
import StyledTitle from './common/StyledTitle';

const { Title, Text } = Typography;
const { useToken } = theme;

const StyledCard = styled(Card)`
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  }
`;

const IconWrapper = styled.div<{color: string; shadowColor: string}>`
  width: 80px;
  height: 80px;
  border-radius: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  transition: all 0.3s ease;
  background: ${props => props.color};
  box-shadow: 0 4px 12px ${props => props.shadowColor};
`;

const ActionButton = styled(Button)`
  border-radius: 6px;
  height: 40px;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

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

      <div style={{ padding: "0 20px" }}>
        {/* Clear Captions Section */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <div style={{
              fontSize: '36px',
              marginRight: '15px',
              width: '60px',
              height: '60px',
              background: `${token.colorError}15`,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <DeleteOutlined style={{ fontSize: "32px", color: token.colorError }} />
            </div>
            <div>
              <Title level={4} style={{ margin: 0, fontWeight: 600, color: '#333' }}>
                {t('clear_all_captions')}
              </Title>
              <Text type="secondary" style={{ fontSize: '15px' }}>
                {t('clear_captions_warning')}
              </Text>
            </div>
          </div>

          <Alert
            message={t('warning')}
            description={t('clear_captions_warning')}
            type="warning"
            showIcon
            style={{ marginBottom: "24px", borderRadius: "8px" }}
          />

          <div style={{ maxWidth: "200px" }}>
            <Button
              type="primary"
              danger
              size="large"
              icon={<DeleteOutlined />}
              onClick={showModal}
              style={{
                width: "100%",
                borderRadius: "8px",
                height: "48px",
                fontSize: "16px",
                fontWeight: "500"
              }}
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
              style={{ marginTop: "16px" }}
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
