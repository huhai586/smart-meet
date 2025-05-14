import React, {useEffect, useState, useRef} from "react";
import {message, Tabs, Tooltip, Dropdown, Menu, Button} from "antd";
import {
    DownloadOutlined,
    FileDoneOutlined,
    HistoryOutlined, SketchOutlined,
    GlobalOutlined,
    LoadingOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import useLoading from './hooks/useLoading';
import Captions from "./components/captions/captions";
import getAiSummary from "./utils/get-ai-summary";
import save from "./utils/save";
import BackupAndRestore from "./components/backup-and-restore";
import Words from "./components/words";
import { DateProvider, useDateContext } from './contexts/DateContext';
import GlobalDatePicker from './components/GlobalDatePicker';
import Loading from './components/Loading';
import useI18n from './utils/i18n';
import UILanguageSelector from './components/UILanguageSelector';
import initAIService from './utils/initAIService';
import Summary from './components/summary';
import aiServiceManager from './utils/ai';
import { getAllAIServiceConfigs } from './utils/getAPIkey';
import googleAITools from './utils/google-AI';

interface CaptionsRef {
    jumpToDate: (date?: dayjs.Dayjs) => void;
}

interface CustomErrorEvent extends Event {
    detail: {
        error: {
            errorDetails?: Array<{message: string}>;
            message?: string;
        };
    };
}

const SidePanel = () => {
    const [messageApi, contextHolder] = message.useMessage();
    const [current, setCurrent] = useState('captions');
    const [loading] = useLoading();
    const { t } = useI18n();
    const [activeService, setActiveService] = useState<string>('');

    const onTabClick = (key: string) => {
        setCurrent(key);
    };

    // 初始化和重新加载 AI 服务
    const loadAIService = async () => {
        try {
            // 先获取当前活动的服务
            const { activeAIService } = await getAllAIServiceConfigs();
            console.log('Active AI service from storage:', activeAIService);
            setActiveService(activeAIService || 'gemini');
            
            // 初始化 AI 服务
            await initAIService();
            
            // 重新初始化 googleAITools
            await googleAITools.reinit();
            
            // 检查初始化后的当前服务类型是否与存储中的匹配
            const currentServiceType = aiServiceManager.getCurrentServiceType();
            console.log('Current AI service after initialization:', currentServiceType);
            
            if (currentServiceType !== activeAIService) {
                console.warn(`Service mismatch! Storage: ${activeAIService}, Current: ${currentServiceType}`);
                if (activeAIService && aiServiceManager.isServiceInitialized(activeAIService)) {
                    // 强制设置为存储中的活动服务
                    aiServiceManager.setCurrentServiceType(activeAIService);
                    console.log(`Forced service type to: ${activeAIService}`);
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
            let message = '';
            try {
                message = errorMsg.errorDetails?.[1]?.message || errorMsg.message;
            } catch (e) {
                console.log({errorMsg})
                message = 'unknown error';
            }
            messageApi.open({
                type: 'error',
                content: message,
            });
        });
    }, []);

    const items = [
        {
            label: t('captions'),
            key: 'captions',
            icon: <FileDoneOutlined />,
            children: (<Captions />),
        },
        {
            label: t('summary'),
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
                {contextHolder}
                <Loading spinning={loading} />
                <GlobalDatePicker />
                <Tabs
                    items={items}
                    onChange={onTabClick}
                    activeKey={current}
                />
            </div>
        </DateProvider>
    );
};

export default SidePanel;
