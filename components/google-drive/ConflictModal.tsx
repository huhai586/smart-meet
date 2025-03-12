import React from 'react';
import { Modal, Button, Card, Row, Col, Typography, theme, Tag } from 'antd';
import type { ConflictData } from './types';

const { Title, Text } = Typography;
const { useToken } = theme;

// 定义冲突解决结果类型
export interface ConflictResolutionResult {
  overwrite: boolean;
  alwaysOverwrite: boolean;
  alwaysSkip: boolean;
}

interface ConflictModalProps {
  visible: boolean;
  conflict: ConflictData | null;
  onResolve: (result: ConflictResolutionResult) => void;
}

const ConflictModal: React.FC<ConflictModalProps> = ({
  visible,
  conflict,
  onResolve
}) => {
  const { token } = useToken();

  if (!conflict) return null;

  // 处理不同的解决方案
  const handleSkip = () => {
    onResolve({ overwrite: false, alwaysOverwrite: false, alwaysSkip: false });
  };

  const handleOverwrite = () => {
    onResolve({ overwrite: true, alwaysOverwrite: false, alwaysSkip: false });
  };

  const handleAlwaysOverwrite = () => {
    onResolve({ overwrite: true, alwaysOverwrite: true, alwaysSkip: false });
  };

  const handleAlwaysSkip = () => {
    onResolve({ overwrite: false, alwaysOverwrite: false, alwaysSkip: true });
  };

  return (
    <Modal
      title={
        <div style={{
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          paddingBottom: "16px",
          marginBottom: "16px"
        }}>
          <Title level={4} style={{ margin: 0 }}>File Conflict</Title>
        </div>
      }
      open={visible}
      onCancel={handleSkip}
      width={600}
      footer={[
        <Button
          key="skip"
          onClick={handleSkip}
          style={{ borderRadius: "6px" }}
        >
          Skip
        </Button>,
        <Button
          key="overwrite"
          type="primary"
          onClick={handleOverwrite}
          style={{ borderRadius: "6px" }}
        >
          Overwrite
        </Button>,
        <Button
          key="alwaysOverwrite"
          type="primary"
          onClick={handleAlwaysOverwrite}
          style={{ borderRadius: "6px" }}
        >
          Always Overwrite
        </Button>,
        <Button
          key="alwaysSkip"
          onClick={handleAlwaysSkip}
          style={{ borderRadius: "6px" }}
        >
          Always Skip
        </Button>
      ]}
      style={{ borderRadius: "8px" }}
    >
      <div>
        <Title level={5} style={{ marginBottom: "16px" }}>Conflict Details</Title>
        <div style={{ marginBottom: '16px' }}>
          <Text strong>File: </Text>
          <Text>{conflict.fileName}</Text>
          {conflict.contentEqual !== undefined && (
            <Tag 
              color={conflict.contentEqual ? "green" : "orange"} 
              style={{ marginLeft: "8px" }}
            >
              {conflict.contentEqual ? "Content Identical" : "Content Different"}
            </Tag>
          )}
        </div>

        <Row gutter={24}>
          <Col span={12}>
            <Card
              size="small"
              title="Remote File"
              style={{
                backgroundColor: '#f5f5f5',
                borderRadius: "6px"
              }}
            >
              <p>
                <Text strong>Size: </Text>
                <Text>{(conflict.remoteSize / 1024).toFixed(2)} KB</Text>
              </p>
              <p>
                <Text strong>Messages: </Text>
                <Text>{conflict.remoteCount}</Text>
              </p>
              <p>
                <Text strong>Location: </Text>
                <Text>Google Drive</Text>
              </p>
            </Card>
          </Col>
          <Col span={12}>
            <Card
              size="small"
              title="Local File"
              style={{
                backgroundColor: '#f0f5ff',
                borderRadius: "6px"
              }}
            >
              <p>
                <Text strong>Size: </Text>
                <Text>{(conflict.localSize / 1024).toFixed(2)} KB</Text>
              </p>
              <p>
                <Text strong>Messages: </Text>
                <Text>{conflict.localCount}</Text>
              </p>
              <p>
                <Text strong>Location: </Text>
                <Text>Local Storage</Text>
              </p>
            </Card>
          </Col>
        </Row>

        <div style={{
          marginTop: '24px',
          padding: '16px',
          backgroundColor: '#fffbe6',
          border: '1px solid #ffe58f',
          borderRadius: '6px'
        }}>
          <Text type="warning" style={{ fontSize: "14px" }}>
            {conflict.contentEqual 
              ? "The files have identical content. Would you still like to overwrite the existing file in Google Drive with your local version?" 
              : "Would you like to overwrite the existing file in Google Drive with your local version?"}
          </Text>
        </div>
      </div>
    </Modal>
  );
};

export default ConflictModal; 