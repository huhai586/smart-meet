import {useState, useEffect} from "react";
import './styles/options.scss';
import googleAITools from "./utils/google-AI";
import getAPIkey from "./utils/getAPIkey";
import {Alert, Modal, Tabs, Typography, Input, Button, Space, Card, theme} from "antd";
import type { TabsProps } from 'antd';
import Account from "~components/Account";
import Sync from '~components/Sync';
import LocalStorageViewer from '~components/LocalStorageViewer';
import { 
    ApiOutlined, 
    UserOutlined, 
    CloudSyncOutlined, 
    DatabaseOutlined,
    KeyOutlined
} from '@ant-design/icons';
import GoogleDriveIntegration from '~components/GoogleDriveIntegration';
import styled from '@emotion/styled';

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

const Options = () => {
    const [apiKey, setApiKey] = useState('');
    const [status, setStatus] = useState('');
    const { token } = useToken();

    useEffect(() => {
        // 加载保存的API key
        getAPIkey().then((res: string) => {
            setApiKey(res);
        });
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        // 保存API key到Chrome存储
        chrome.storage.sync.set(
            { geminiApiKey: apiKey },
            () => {
                setStatus('Settings saved successfully!');
                googleAITools.init();
                setTimeout(() => setStatus(''), 2000);
                chrome.runtime.sendMessage({
                    type: 'apiKeyUpdated',
                });
            }
        );
    };

    const info = () => {
        Modal.info({
            title: 'Dont have a gemini API key?',
            content: (
                <div>
                    click here<a target={'_blank'} href={'https://aistudio.google.com/apikey'}> https://aistudio.google.com/apikey</a> to get your API key
                </div>
            ),
            onOk() {
                window.open('https://aistudio.google.com/apikey', '_blank');
            },
        });
    };

    useEffect(() => {
        // 加载保存的API key
        getAPIkey().catch((res: string) => {
            info()
        });
    }, []);

    const ApiKeyContent = () => (
        <div style={{ padding: "40px 20px", maxWidth: "800px", margin: "0 auto" }}>
            <Title level={2} style={{
                marginBottom: "40px",
                textAlign: "center",
                fontSize: "32px",
                fontWeight: "600",
                background: `linear-gradient(120deg, ${token.colorPrimary}, ${token.colorInfo})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
            }}>
                AI Settings
            </Title>

            <StyledCard>
                <Space direction="vertical" style={{ width: "100%" }}>
                    <IconWrapper color={`${token.colorInfo}15`} shadowColor={`${token.colorInfo}20`}>
                        <KeyOutlined style={{ fontSize: "36px", color: token.colorInfo }} />
                    </IconWrapper>
                    
                    <Title level={4} style={{ textAlign: "center", margin: "16px 0", fontWeight: "600" }}>
                        Gemini API Configuration
                    </Title>
                    
                    <Text type="secondary" style={{
                        display: "block",
                        textAlign: "center",
                        marginBottom: "32px",
                        fontSize: "15px",
                        lineHeight: "1.6"
                    }}>
                        Enter your Gemini API key to enable AI-powered features. You can obtain the API key from Google AI Studio.
                    </Text>

                    <Alert
                        style={{ marginBottom: "24px" }}
                        message="Please enter your Gemini API key to easily use it for AI tasks."
                        description={
                            <Text type="secondary">
                                You can obtain the API key from{' '}
                                <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">
                                    https://aistudio.google.com/apikey
                                </a>
                            </Text>
                        }
                        type="info"
                        showIcon
                    />

                    <Input.Password
                        size="large"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Enter your Gemini API key"
                        style={{ marginBottom: "24px" }}
                    />

                    <div style={{ textAlign: "center" }}>
                        <ActionButton
                            type="primary"
                            size="large"
                            onClick={handleSubmit}
                            style={{
                                minWidth: "180px",
                                background: token.colorInfo,
                                borderColor: token.colorInfo
                            }}
                        >
                            Save Settings
                        </ActionButton>
                    </div>

                    {status && (
                        <Alert
                            style={{ marginTop: "24px" }}
                            message={status}
                            type="success"
                            showIcon
                        />
                    )}
                </Space>
            </StyledCard>
        </div>
    );

    const items: TabsProps['items'] = [
        {
            key: '1',
            label: (
                <span>
                    <ApiOutlined />
                    AI Settings
                </span>
            ),
            children: <ApiKeyContent />,
        },
        {
            key: '2',
            label: (
                <span>
                    <CloudSyncOutlined />
                    Google Drive Sync
                </span>
            ),
            children: <GoogleDriveIntegration />,
        },
        {
            key: '3',
            label: (
                <span>
                    <DatabaseOutlined />
                    View Local Storage
                </span>
            ),
            children: <LocalStorageViewer />,
        },
    ];

    return (
        <div className="options-container">
            <Tabs
                defaultActiveKey="1"
                tabPosition="left"
                items={items}
                className="options-tabs"
            />
        </div>
    );
};

export default Options;
