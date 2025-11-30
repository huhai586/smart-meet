import {useState, useEffect} from "react";
import './styles/options.scss';
import './styles/sidebar.scss';
import {message} from "antd";
import './utils/dayjs-config'; // Import global dayjs configuration
import { setDayjsLocale } from './utils/dayjs-config';
import GoogleDriveIntegration from '~components/options/GoogleDriveIntegration';
import Calendar from '~components/options/Calendar';
import Sidebar from '~components/options/Sidebar';
import TranslationSettings from '~components/options/TranslationSettings';
import UILanguageSettings from '~components/options/UILanguageSettings';
import ClearCaptionsSettings from '~components/options/ClearCaptionsSettings';
import ExtensionSettings from '~components/options/ExtensionSettings';
import MeetingInterface from '~components/options/MeetingInterface';
import SidepanelSettings from '~components/options/SidepanelSettings';
import AISettings from '~components/options/ai-settings';
import Welcome from '~pages/welcome';
import useI18n from './utils/i18n';
import { GoogleAuthProvider } from './contexts/GoogleAuthContext';
import aiServiceManager from './utils/ai';
import { getAllAIServiceConfigs } from './utils/getAI';

// 添加调试信息
console.log('Options page loaded, GoogleAuthProvider imported:', !!GoogleAuthProvider);

// 路由映射表 - 将路由路径映射到对应的标签页key
const ROUTE_MAPPING = {
  'sidepanel-settings': '1',
  'ai-settings': '2',
  'google-drive': '3',
  'calendar': '4',
  'translation': '5',
  'ui-language': '6',
  'meeting-interface': '7',
  'extension': '8',
  'clear-captions': '9',
  'welcome': 'welcome'
};

// 反向映射表 - 将标签页key映射到对应的路由路径
const KEY_TO_ROUTE = {
  '1': 'sidepanel-settings',
  '2': 'ai-settings',
  '3': 'google-drive',
  '4': 'calendar',
  '5': 'translation',
  '6': 'ui-language',
  '7': 'meeting-interface',
  '8': 'extension',
  '9': 'clear-captions',
  'welcome': 'welcome'
};

const Options = () => {
    // 默认使用URL哈希中的标签页key，如果没有则使用'1'
    const [activeKey, setActiveKey] = useState(() => {
      // 从URL哈希中获取路由路径
      const hash = window.location.hash.substring(1); // 移除#号
      return ROUTE_MAPPING[hash] || '1'; // 返回对应的key，如果没有则使用默认值'1'
    });
    const { t: _t, langCode } = useI18n();
    const [_messageApi, _contextHolder] = message.useMessage();

    // Set dayjs locale when language changes
    useEffect(() => {
        setDayjsLocale(langCode);
    }, [langCode]);

    // Initialize AI service on mount
    useEffect(() => {
        const loadAIService = async () => {
            try {
                console.log('[Options] Loading AI service...');
                const aisConfig = await getAllAIServiceConfigs();
                console.log('[Options] AI config loaded:', aisConfig);
                
                const activeService = aisConfig.data.find(svc => svc.aiName === aisConfig.active);
                console.log('[Options] Active service:', activeService);
                
                if (activeService && activeService.apiKey) {
                    console.log('[Options] Initializing AI service:', activeService.aiName);
                    await aiServiceManager.initService(activeService.aiName, activeService);
                    aiServiceManager.setCurrentServiceType(activeService.aiName);
                    console.log('[Options] AI service initialized successfully:', activeService.aiName);
                } else {
                    console.warn('[Options] No active AI service with API key found');
                }
            } catch (error) {
                console.error('[Options] Failed to initialize AI service:', error);
            }
        };

        loadAIService();

        // Listen for AI service updates
        const handleMessage = (request: any) => {
            if (request.type === 'apiKeyUpdated') {
                console.log('[Options] Received apiKeyUpdated message, reloading AI service');
                loadAIService();
            }
        };

        chrome.runtime.onMessage.addListener(handleMessage);

        return () => {
            chrome.runtime.onMessage.removeListener(handleMessage);
        };
    }, []);

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
        window.location.hash = 'sidepanel-settings';
      }
    }, []);

    // 添加调试信息
    useEffect(() => {
        console.log('Options component mounted, GoogleAuthProvider will be used');
    }, []);

    const renderContent = () => {
        switch (activeKey) {
            case '1':
                return <SidepanelSettings />;
            case '2':
                return <AISettings />;
            case '3':
                console.log('Rendering GoogleDriveIntegration');
                return <GoogleDriveIntegration />;
            case '4':
                return <Calendar />;
            case '5':
                return <TranslationSettings />;
            case '6':
                return <UILanguageSettings />;
            case '7':
                return <MeetingInterface />;
            case '8':
                return <ExtensionSettings />;
            case '9':
                return <ClearCaptionsSettings />;
            case 'welcome':
                return <Welcome />;
            default:
                return <SidepanelSettings />;
        }
    };

    // 如果是welcome页面，直接返回Welcome组件，不显示侧边栏
    if (activeKey === 'welcome') {
        return (
            <GoogleAuthProvider>
                <Welcome />
            </GoogleAuthProvider>
        );
    }

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
