import {useState, useEffect} from "react";
import './styles/options.scss';
import googleAITools from "./utils/google-AI";
import getAPIkey from "./utils/getAPIkey";
import {Alert, Modal, Tabs} from "antd";
import type { TabsProps } from 'antd';
import Account from "~components/Account";
import Sync from '~components/Sync';
import LocalStorageViewer from '~components/LocalStorageViewer';
import { DatabaseOutlined } from '@ant-design/icons';

const Options = () => {
    const [apiKey, setApiKey] = useState('');
    const [status, setStatus] = useState('');

    useEffect(() => {
        // 加载保存的API key
        getAPIkey().then((res: string) => {
            setApiKey(res);
        });
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        // 保存API key到Chrome存储
        chrome.storage.sync.set(
            { geminiApiKey: apiKey },
            () => {
                setStatus('Settings saved successfully!');
                googleAITools.init();
                setTimeout(() => setStatus(''), 2000);
                chrome.runtime.sendMessage({
                    type: 'apiKeyUpdated',
                });
            }
        );
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

    useEffect(() => {
        // 加载保存的API key
        getAPIkey().catch((res: string) => {
            info()
        });
    }, []);

    const ApiKeyContent = () => (
        <div className="form-container">
            <Alert
                banner={true}
                description={'You can obtain the API key from https://aistudio.google.com/apikey'}
                message="Please enter your Gemini API key to easily use it for AI tasks."
                type="info"
                className={'options-alert'}
            />
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="apiKey">Gemini API Key:</label>
                    <input
                        type="text"
                        id="apiKey"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Enter your Gemini API key"
                    />
                </div>
                <button type="submit" className="save-button">
                    Save Settings
                </button>
                {status && <div className="status-message">{status}</div>}
            </form>
        </div>
    );

    const items: TabsProps['items'] = [
        {
            key: '1',
            label: 'API Settings',
            children: <ApiKeyContent />,
        },
        {
            key: '2',
            label: 'Account',
            children: <Account />,
        },
        {
            key: '3',
            label: 'Sync',
            children: <Sync />,
        },
        {
            key: '4',
            label: (
                <span>
                    <DatabaseOutlined /> Local Storage
                </span>
            ),
            children: <LocalStorageViewer />,
        },
    ];

    return (
        <div className="options-container">
            <Tabs
                defaultActiveKey="1"
                tabPosition="left"
                items={items}
                className="options-tabs"
            />
        </div>
    );
};

export default Options;
