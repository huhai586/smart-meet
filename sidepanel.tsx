import React, {useEffect, useState} from "react";
import {message, Tabs} from "antd";
import {
    FileDoneOutlined,
    HistoryOutlined, SketchOutlined,
} from '@ant-design/icons';
import useLoading from './hooks/useLoading';
import Captions from "./components/captions/captions";
import Words from "./components/words";
import { DateProvider } from './contexts/DateContext';
import GlobalDatePicker from './components/GlobalDatePicker';
import Loading from './components/Loading';
import useI18n from './utils/i18n';
import initAIService from './utils/initAIService';
import Summary from './components/summary';
import aiServiceManager from './utils/ai';
import { getAllAIServiceConfigs } from './utils/getAI';
import googleAITools from './utils/google-AI';

import './styles/sidepanel.scss';

interface CustomErrorEvent extends Event {
    detail: {
        error: {
            errorDetails?: Array<{message: string}>;
            message?: string;
        };
    };
}

const SidePanel = () => {
    const [messageApi] = message.useMessage();
    const [current, setCurrent] = useState('captions');
    const [loading] = useLoading();
    const { t } = useI18n();
    const [_activeService, setActiveService] = useState<string>('');

    const onTabClick = (key: string) => {
        setCurrent(key);
    };

    // 初始化和重新加载 AI 服务
    const loadAIService = async () => {
        try {
            // 先获取当前活动的服务
            const aisConfig = await getAllAIServiceConfigs();
            console.log('Active AI service from storage:', aisConfig.active);
            setActiveService(aisConfig.active || 'gemini');

            // 初始化 AI 服务
            await initAIService();

            // 重新初始化 googleAITools
            await googleAITools.reinit();

            // 检查初始化后的当前服务类型是否与存储中的匹配
            const currentServiceType = aiServiceManager.getCurrentServiceType();
            console.log('Current AI service after initialization:', currentServiceType);

            if (currentServiceType !== aisConfig.active) {
                console.warn(`Service mismatch! Storage: ${aisConfig.active}, Current: ${currentServiceType}`);
                if (aisConfig.active && aiServiceManager.isServiceInitialized(aisConfig.active)) {
                    // 强制设置为存储中的活动服务
                    aiServiceManager.setCurrentServiceType(aisConfig.active);
                    console.log(`Forced service type to: ${aisConfig.active}`);
                }
            }
        } catch (error) {
            console.error('Failed to initialize AI service:', error);
        }
    };

    useEffect(() => {
        // 初始化AI服务
        loadAIService();

        const updateApiKey = (request) => {
            if (request.type === 'apiKeyUpdated') {
                console.log('Received apiKeyUpdated message, reloading AI service');
                // 重新初始化AI服务
                loadAIService();
            }
        }
        chrome.runtime.onMessage.addListener(updateApiKey);
        return () => {
            chrome.runtime.onMessage.removeListener(updateApiKey);
        }
    },[]);

    useEffect(() => {
        const handleMessage = (message) => {
            if (message.action === 'jump-to-date') {
                console.log('SidePanel: Switching to captions tab');
                setCurrent('captions');
            }
        };

        chrome.runtime.onMessage.addListener(handleMessage);
        return () => {
            chrome.runtime.onMessage.removeListener(handleMessage);
        };
    }, [setCurrent]);

    useEffect(() => {
        window.addEventListener('ajax-error', (e: CustomErrorEvent) => {
            const errorMsg = e.detail.error;
            console.log('ajax-error', errorMsg);
            // 直接显示原始错误信息
            let message = '';
            try {
                message = errorMsg.errorDetails?.[1]?.message || errorMsg.message || 'Unknown error occurred';
            } catch {
                console.log({errorMsg})
                message = 'Unknown error occurred';
            }
            messageApi.open({
                type: 'error',
                content: message,
            });
        });
    }, [messageApi]);

    const items = [
        {
            label: t('captions'),
            key: 'captions',
            icon: <FileDoneOutlined />,
            children: (<Captions />),
        },
        {
            label: t('sidepanel_summary'),
            key: 'summary',
            icon: <SketchOutlined />,
            children: <Summary />,
        },
        {
            label: t('translation_records'),
            key: 'words',
            icon: <HistoryOutlined />,
            children: <Words currentTab={current} />,
        },
    ];


    return (
        <DateProvider>
            <div className={'side-panel'}>
                <Loading spinning={loading} />
                <Tabs
                    items={items}
                    onChange={onTabClick}
                    activeKey={current}
                    tabBarExtraContent={<GlobalDatePicker />}
                />
            </div>
        </DateProvider>
    );
};

export default SidePanel;
