import {Suspense, useState, useEffect, useRef} from "react";
import './styles/options.scss';
import './styles/sidebar.scss';
import './styles/theme-vars.scss';
import { message, ConfigProvider, theme } from "antd";
import './utils/dayjs-config'; // Import global dayjs configuration
import { setDayjsLocale } from './utils/dayjs-config';
import { useDarkMode } from '~/hooks/useDarkMode';
import Sidebar from '~components/options/Sidebar';
import OptionsHeader from '~components/options/OptionsHeader';
import { OPTIONS_PAGES, findPage, isPageRoute } from '~components/options/pages';
import Welcome from '~pages/welcome';
import { OptionsRoute } from '~utils/options-routes';
import useI18n from './utils/i18n';
import { GoogleAuthProvider } from './contexts/GoogleAuthContext';
import aiServiceManager from './utils/ai';
import { getAllAIServiceConfigs } from './utils/getAI';

// 添加调试信息
console.log('Options page loaded, GoogleAuthProvider imported:', !!GoogleAuthProvider);

/** The route in the URL hash; a hash that is not a page (and not the welcome page) opens the first page. */
const routeFromHash = (): string => {
  const hash = window.location.hash.substring(1);
  return hash === OptionsRoute.WELCOME || isPageRoute(hash) ? hash : OPTIONS_PAGES[0].route;
};

const Options = () => {
    // The page is the hash; the sidebar links only change the hash
    const [activeRoute, setActiveRoute] = useState(routeFromHash);
    const { t: _t, langCode } = useI18n();
    const { isDark } = useDarkMode();
    const [_messageApi, _contextHolder] = message.useMessage();
    const [devMode, setDevMode] = useState(() => {
        // Use URL hash as an optimistic hint so the Developer tab renders immediately
        // on page reload without waiting for the async storage read.
        const hash = window.location.hash.substring(1);
        return hash === OptionsRoute.DEVELOPER;
    });

    // Confirm (and correct if needed) from local storage
    useEffect(() => {
        chrome.storage.local.get(['devModeEnabled'], (result) => {
            setDevMode(!!result.devModeEnabled);
        });
    }, []);

    const handleDevUnlock = () => {
        setDevMode(true);
        chrome.storage.local.set({ devModeEnabled: true });
    };

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

    const contentAreaRef = useRef<HTMLDivElement>(null);

    // Follow the hash, whoever changes it: the sidebar, another extension page moving this tab, the back button
    useEffect(() => {
      const handleHashChange = () => {
        setActiveRoute(routeFromHash());
        if (contentAreaRef.current) {
          contentAreaRef.current.scrollTop = 0;
        }
      };

      window.addEventListener('hashchange', handleHashChange);
      return () => {
        window.removeEventListener('hashchange', handleHashChange);
      };
    }, []);

    // 初始加载时设置URL哈希（如果没有的话）
    useEffect(() => {
      if (!window.location.hash) {
        window.location.hash = OptionsRoute.GENERAL;
      }
    }, []);

    // 添加调试信息
    useEffect(() => {
        console.log('Options component mounted, GoogleAuthProvider will be used');
    }, []);

    const renderContent = () => {
        const Page = findPage(activeRoute).component;
        return (
            <Suspense fallback={null}>
                <Page />
            </Suspense>
        );
    };

    // 如果是welcome页面，直接返回Welcome组件，不显示侧边栏
    if (activeRoute === OptionsRoute.WELCOME) {
        return (
            <ConfigProvider theme={{ algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm }}>
                <GoogleAuthProvider>
                    <Welcome />
                </GoogleAuthProvider>
            </ConfigProvider>
        );
    }

    return (
        <ConfigProvider theme={{ algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm }}>
        <GoogleAuthProvider>
            <div className="options-wrapper">
                <div className="options-card">
                    <OptionsHeader />
                    <div className="options-container">
                        <Sidebar
                          activeKey={activeRoute}
                          devMode={devMode}
                          onDevUnlock={handleDevUnlock}
                        />
                        <div className="content-area" ref={contentAreaRef}>
                            {renderContent()}
                        </div>
                    </div>
                </div>
            </div>
        </GoogleAuthProvider>
        </ConfigProvider>
    );
};

export default Options;
