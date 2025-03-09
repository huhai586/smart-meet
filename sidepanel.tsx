import React, {useEffect, useState, useRef} from "react";
import {message, Tabs, Tooltip} from "antd";
import {
    DownloadOutlined,
    FileDoneOutlined,
    HistoryOutlined, RollbackOutlined, SketchOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

import './all.scss';
import Summary from "./components/summary";
import googleAITools from './utils/google-AI';
import Extension from "./components/extension";
import useLoading from "./hooks/useLoading";
import Captions from "./components/captions/captions";
import getAiSummary from "./utils/get-ai-summary";
import save from "./utils/save";
import BackupAndRestore from "./components/backup-and-restore";
import Words from "./components/words";
import { DateProvider } from './contexts/DateContext';
import GlobalDatePicker from './components/GlobalDatePicker';
import Loading from './components/Loading';

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
    const captionsRef = useRef<CaptionsRef>(null);

    const onTabClick = (key: string) => {
        setCurrent(key);
    };

    const jumpToCaptions = (date?: dayjs.Dayjs) => {
        setCurrent('captions');
        if (captionsRef.current) {
            captionsRef.current.jumpToDate(date);
        }
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

    const saveCaptions = () => {
        console.log('start downloading')
        getAiSummary('请将这份会议记录以markdown形式呈现,里面的时间戳请转换为/m/d/h/m/s 格式').then((res) => {
            save(res, 'captions.md');
        })
    }

    const items = [
        {
            label: 'Captions',
            key: 'captions',
            icon: <HistoryOutlined />,
            children: <Captions onRef={ref => captionsRef.current = ref}/>
        },
        {
            label: 'Summary',
            key: 'summary',
            icon: <FileDoneOutlined />,
            disabled: false,
            children: <Summary/>
        },
        {
            label: 'Extension',
            key: 'extension',
            icon: <SketchOutlined />,
            disabled: false,
            children: <Extension jumpToCaptions={jumpToCaptions}/>
        },
        {
            label: 'Translation records',
            key: 'Translation records',
            icon: <RollbackOutlined />,
            children: <Words currentTab={current}/>,
            disabled: false,
        },
    ];

    return (
        <DateProvider>
            <div className={'side-panel'}>
                {contextHolder}
                <Loading spinning={loading} />
                <GlobalDatePicker />
                <Tabs
                    tabBarExtraContent={
                        <div className="tab-extra-content">
                            <div className={`download ${loading ? 'hide' : ''}`} onClick={saveCaptions}>
                                <Tooltip color={'#87d068'} title={'down load all captions'} placement="left">
                                    <DownloadOutlined />
                                </Tooltip>
                            </div>
                        </div>
                    }
                    items={items}
                    onChange={onTabClick}
                    activeKey={current}
                />
            </div>
        </DateProvider>
    );
};

export default SidePanel;