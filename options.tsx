import {useState, useEffect} from "react";
import './styles/options.scss';
import './styles/sidebar.scss';
import {Alert, Modal, Typography, Input, Button, Space, Card, theme} from "antd";
import {
    KeyOutlined,
} from '@ant-design/icons';
import GoogleDriveIntegration from '~components/GoogleDriveIntegration';
import styled from '@emotion/styled';
import Calendar from '~components/Calendar';
import Sidebar from '~components/Sidebar';
import StyledTitle from '~components/common/StyledTitle';
import TranslationSettings from '~components/TranslationSettings';
import UILanguageSettings from '~components/UILanguageSettings';
import ClearCaptionsSettings from '~components/ClearCaptionsSettings';
import ExtensionSettings from '~components/ExtensionSettings';
import useI18n from './utils/i18n';
import { GoogleAuthProvider } from './contexts/GoogleAuthContext';

// 添加调试信息
console.log('Options page loaded, GoogleAuthProvider imported:', !!GoogleAuthProvider);

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

// 路由映射表 - 将路由路径映射到对应的标签页key
const ROUTE_MAPPING = {
  'ai-settings': '1',
  'google-drive': '2',
  'calendar': '3',
  'translation': '4',
  'ui-language': '5',
  'extension': '6',
  'clear-captions': '7'
};

// 反向映射表 - 将标签页key映射到对应的路由路径
const KEY_TO_ROUTE = {
  '1': 'ai-settings',
  '2': 'google-drive',
  '3': 'calendar',
  '4': 'translation',
  '5': 'ui-language',
  '6': 'extension',
  '7': 'clear-captions'
};

const Options = () => {
    const [apiKey, setApiKey] = useState('');
    const [status, setStatus] = useState('');
    // 默认使用URL哈希中的标签页key，如果没有则使用'1'
    const [activeKey, setActiveKey] = useState(() => {
      // 从URL哈希中获取路由路径
      const hash = window.location.hash.substring(1); // 移除#号
      return ROUTE_MAPPING[hash] || '1'; // 返回对应的key，如果没有则使用默认值'1'
    });
    const { token } = useToken();
    const { t } = useI18n();

    // 处理标签切换
    const handleTabChange = (key: string) => {
      setActiveKey(key);
      // 更新URL哈希
      const route = KEY_TO_ROUTE[key] || 'ai-settings';
      window.location.hash = route;
    };

    // 监听URL哈希变化
    useEffect(() => {
      const handleHashChange = () => {
        const hash = window.location.hash.substring(1);
        const newKey = ROUTE_MAPPING[hash] || '1';
        if (newKey !== activeKey) {
          setActiveKey(newKey);
        }
      };

      window.addEventListener('hashchange', handleHashChange);
      return () => {
        window.removeEventListener('hashchange', handleHashChange);
      };
    }, [activeKey]);

    // 初始加载时设置URL哈希（如果没有的话）
    useEffect(() => {
      if (!window.location.hash) {
        window.location.hash = 'ai-settings';
      }
    }, []);

    useEffect(() => {
        // 加载保存的API keys
        import('./utils/getAPIkey').then(({ getAllAIServiceConfigs }) => {
            getAllAIServiceConfigs().then(({ aiServices }) => {
                // 如果有Gemini API密钥，则显示
                if (aiServices.gemini?.apiKey) {
                    setApiKey(aiServices.gemini.apiKey);
                } else {
                    // 否则尝试从旧配置加载
                    import('./utils/getAPIkey').then(({ default: getAPIkey }) => {
                        getAPIkey('gemini').catch((res: string) => {
                            info();
                        });
                    });
                }
            }).catch(() => {
                info();
            });
        });
    }, []);

    // 添加调试信息
    useEffect(() => {
        console.log('Options component mounted, GoogleAuthProvider will be used');
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        // 使用新的AI服务配置系统保存API key
        import('./utils/getAPIkey').then(({ saveAIServiceConfig }) => {
            saveAIServiceConfig('gemini', apiKey, true).then(() => {
                setStatus('Settings saved successfully!');
                setTimeout(() => setStatus(''), 2000);
                
                // 通知其他部分API密钥已更新
                chrome.runtime.sendMessage({
                    type: 'apiKeyUpdated',
                });
            });
        });
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

    const ApiKeyContent = () => (
        <div style={{ padding: "40px 20px", maxWidth: "800px", margin: "0 auto" }}>
            <StyledTitle>{t('ai_settings')}</StyledTitle>

            <StyledCard>
                <Space direction="vertical" style={{ width: "100%" }}>
                    <IconWrapper color={`${token.colorInfo}15`} shadowColor={`${token.colorInfo}20`}>
                        <KeyOutlined style={{ fontSize: "36px", color: token.colorInfo }} />
                    </IconWrapper>

                    <Title level={4} style={{ textAlign: "center", margin: "16px 0", fontWeight: "600" }}>
                        {t('gemini_api_config')}
                    </Title>

                    <Text type="secondary" style={{
                        display: "block",
                        textAlign: "center",
                        marginBottom: "32px",
                        fontSize: "15px",
                        lineHeight: "1.6"
                    }}>
                        {t('api_key_desc')}
                    </Text>

                    <Alert
                        style={{ marginBottom: "24px" }}
                        message={t('api_key_info')}
                        description={
                            <Text type="secondary">
                                {t('api_key_source')}{' '}
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
                        placeholder={t('enter_api_key')}
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
                            {t('save_settings')}
                        </ActionButton>
                    </div>

                    {status && (
                        <Alert
                            style={{ marginTop: "24px" }}
                            message={t('settings_saved')}
                            type="success"
                            showIcon
                        />
                    )}
                </Space>
            </StyledCard>
        </div>
    );

    const renderContent = () => {
        switch (activeKey) {
            case '1':
                return <ApiKeyContent />;
            case '2':
                console.log('Rendering GoogleDriveIntegration');
                return <GoogleDriveIntegration />;
            case '3':
                return <Calendar />;
            case '4':
                return <TranslationSettings />;
            case '5':
                return <UILanguageSettings />;
            case '6':
                return <ExtensionSettings />;
            case '7':
                return <ClearCaptionsSettings />;
            default:
                return <ApiKeyContent />;
        }
    };

    return (
        <GoogleAuthProvider>
            <div className="options-container">
                <Sidebar activeKey={activeKey} onChange={handleTabChange} />
                <div className="content-area">
                    {renderContent()}
                </div>
            </div>
        </GoogleAuthProvider>
    );
};

export default Options;
