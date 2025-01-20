import React, {useEffect, useState} from "react";
import {message, Tabs, Tooltip} from "antd";
import {
    DownloadOutlined,
    FileDoneOutlined,
    HistoryOutlined, RollbackOutlined, SketchOutlined,
} from '~node_modules/@ant-design/icons';

import './all.scss';
import Summary from "./components/summary";
import googleAITools from './utils/google-AI';
import Extension from "./components/extension";
import {Spin} from "~node_modules/antd";
import useLoading from "./hooks/useLoading";
import Captions from "./components/captions/captions";
import getAiSummary from "~utils/get-ai-summary";
import save from "~utils/save";
import BackupAndRestore from "~components/backup-and-restore";

const SidePanel = () => {
    const [messageApi, contextHolder] = message.useMessage();
    const [current, setCurrent] = useState('captions');
    const [loading] = useLoading();
    const onTabClick = (key: string) => {
        setCurrent(key);
    };

    const items = [
        {
            label: 'Captions',
            key: 'captions',
            icon: <HistoryOutlined />,
            children: <Captions/>
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
            children: <Extension jumpToCaptions={() => {setCurrent('captions')}}/>
        },
        {
            label: 'Labs',
            key: 'labs',
            icon: <RollbackOutlined />,
            children: <BackupAndRestore />,
            disabled: true,
        },
    ];



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
    },[])

    useEffect(() => {
        window.addEventListener('ajax-error', (e) => {
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
    return (
        <div className={'side-panel'}>
            {contextHolder}
            <div className="loading">
                <Spin spinning={loading} />
            </div>
            <Tabs
                tabBarExtraContent={<div className={`download ${loading ? 'hide' : ''}`} onClick={saveCaptions}>
            <Tooltip color={'#87d068'} title={'down load all captions'} placement="left"><DownloadOutlined /></Tooltip>
            </div>}
                items={items}
                onChange={onTabClick}
                activeKey={current}
            />
        </div>
    );
};

export default SidePanel
