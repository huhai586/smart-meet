import {useState, useEffect} from "react";
import './styles/options.scss';
import './styles/sidebar.scss';
import {message} from "antd";
import GoogleDriveIntegration from '~components/options/GoogleDriveIntegration';
import Calendar from '~components/options/Calendar';
import Sidebar from '~components/options/Sidebar';
import TranslationSettings from '~components/options/TranslationSettings';
import UILanguageSettings from '~components/options/UILanguageSettings';
import ClearCaptionsSettings from '~components/options/ClearCaptionsSettings';
import ExtensionSettings from '~components/options/ExtensionSettings';
import AISettings from '~components/options/AISettings';
import Welcome from '~pages/welcome';
import useI18n from './utils/i18n';
import { GoogleAuthProvider } from './contexts/GoogleAuthContext';

// 添加调试信息
console.log('Options page loaded, GoogleAuthProvider imported:', !!GoogleAuthProvider);

// 路由映射表 - 将路由路径映射到对应的标签页key
const ROUTE_MAPPING = {
  'ai-settings': '1',
  'google-drive': '2',
  'calendar': '3',
  'translation': '4',
  'ui-language': '5',
  'extension': '6',
  'clear-captions': '7',
  'welcome': 'welcome'
};

// 反向映射表 - 将标签页key映射到对应的路由路径
const KEY_TO_ROUTE = {
  '1': 'ai-settings',
  '2': 'google-drive',
  '3': 'calendar',
  '4': 'translation',
  '5': 'ui-language',
  '6': 'extension',
  '7': 'clear-captions',
  'welcome': 'welcome'
};

const Options = () => {
    // 默认使用URL哈希中的标签页key，如果没有则使用'1'
    const [activeKey, setActiveKey] = useState(() => {
      // 从URL哈希中获取路由路径
      const hash = window.location.hash.substring(1); // 移除#号
      return ROUTE_MAPPING[hash] || '1'; // 返回对应的key，如果没有则使用默认值'1'
    });
    const { t } = useI18n();
    const [messageApi, contextHolder] = message.useMessage();

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

    // 添加调试信息
    useEffect(() => {
        console.log('Options component mounted, GoogleAuthProvider will be used');
    }, []);

    const renderContent = () => {
        switch (activeKey) {
            case '1':
                return <AISettings />;
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
            case 'welcome':
                return <Welcome />;
            default:
                return <AISettings />;
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
