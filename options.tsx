import {useState, useEffect} from "react";
import './styles/options.scss';
import googleAITools from "./utils/google-AI";
import getAPIkey from "./utils/getAPIkey";
import {Alert, Modal} from "antd";

const options = () => {
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
                    click here<a href={'https://aistudio.google.com/apikey'}> https://aistudio.google.com/apikey</a> to get your API key
                </div>
            ),
            onOk() {},
        });
    };

    useEffect(() => {
        // 加载保存的API key
        getAPIkey().catch((res: string) => {
            info()
        });
    }, []);
    return (
        <div className="options-container">

            <Alert
                banner={true}
                description={'You can obtain the API key from https://aistudio.google.com/apikey'}
                message="Please enter your Gemini API key to easily use it for AI tasks." type="info"  className={'options-alert'}/>
            <div className={'options'}>
                <div className="form-container">
                    <h1>Options</h1>
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
            </div>
        </div>
    );
}

export default options
