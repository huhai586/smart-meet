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
    <div style={{ padding: "40px 20px", maxWidth: "800px", margin: "0 auto" }}>
      <StyledTitle>{t('clear_captions')}</StyledTitle>
      
      <StyledCard>
        <Space direction="vertical" style={{ width: "100%" }}>
          <IconWrapper color={`${token.colorError}15`} shadowColor={`${token.colorError}20`}>
            <DeleteOutlined style={{ fontSize: "36px", color: token.colorError }} />
          </IconWrapper>

          <Title level={4} style={{ textAlign: "center", margin: "16px 0", fontWeight: "600" }}>
            {t('clear_captions')}
          </Title>

          <Text type="secondary" style={{
            display: "block",
            textAlign: "center",
            marginBottom: "32px",
            fontSize: "15px",
            lineHeight: "1.6"
          }}>
            {t('clear_captions_desc')}
          </Text>

          <Alert
            style={{ marginBottom: "24px" }}
            message={t('clear_captions_warning') || "Warning: This action cannot be undone"}
            description={
              <Text type="secondary">
                {t('clear_captions_warning_desc') || "This will permanently delete all recorded captions from your browser storage."}
              </Text>
            }
            type="warning"
            showIcon
          />

          <div style={{ textAlign: "center" }}>
            <ActionButton
              danger
              type="primary"
              size="large"
              onClick={showModal}
              style={{
                minWidth: "180px"
              }}
              icon={<DeleteOutlined />}
            >
              {t('clear_all_captions')}
            </ActionButton>
          </div>
        </Space>
      </StyledCard>

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
  );
};

export default ClearCaptionsSettings; 