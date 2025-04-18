import React, {useEffect, useState, useRef} from "react";
import {message, Tabs, Tooltip, Dropdown, Menu, Button} from "antd";
import {
    DownloadOutlined,
    FileDoneOutlined,
    HistoryOutlined, SketchOutlined,
    GlobalOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

import './all.scss';
import Summary from "./components/summary";
import googleAITools from './utils/google-AI';
import useLoading from "./hooks/useLoading";
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

    const onTabClick = (key: string) => {
        setCurrent(key);
    };

    useEffect(() => {
        const updateApiKey = (request) => {
            if (request.type === 'apiKeyUpdated') {
                googleAITools.init();
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
