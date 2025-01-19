import React, {useEffect, useState} from "react";
import {message, Tabs} from "antd";
import {
    FileDoneOutlined,
    HistoryOutlined, SketchOutlined,
} from '~node_modules/@ant-design/icons';

import './all.scss';
import Summary from "./components/summary";
import googleAITools from './utils/google-AI';
import Extension from "./components/extension";
import {Spin} from "~node_modules/antd";
import useLoading from "./hooks/useLoading";
import Captions from "./components/captions/captions";

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
            children: <Extension/>
        },
        // {
        //     label: 'Words',
        //     key: 'wordslog',
        //     icon: <FileWordOutlined />,
        //     disabled: true,
        // },
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
                message = errorMsg.errorDetails[1].message;
            } catch (e) {
                message = JSON.stringify(errorMsg);
            }
            messageApi.open({
                type: 'error',
                content: message,
            });
        });
    }, []);


    return (
        <div className={'side-panel'}>
            {contextHolder}
            <div className="loading">
                <Spin spinning={loading} />
            </div>
            <Tabs
                items={items}
                onChange={onTabClick}
                activeKey={current}
            />
        </div>
    );
};

export default SidePanel
