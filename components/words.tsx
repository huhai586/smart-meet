import {List} from "antd";
import React, {useEffect, useState} from "react";
import '../styles/words.scss'
import {getTranslatedWords} from "~utils/translate";
import {InfoOutlined} from "~node_modules/@ant-design/icons";
import {message} from "~node_modules/antd";
import translateSingleWords from "~utils/translate-signal-words";

const Words = (props: {currentTab: string}) => {
    const [data, setData] = useState([]);
    const [messageApi, contextHolder] = message.useMessage();

    useEffect(() => {
        getTranslatedWords().then((res) => {
            setData(res);
        });
    }, [props.currentTab]);

    const success = (res: string) => {
        messageApi.destroy()
        messageApi.open({
            type: 'success',
            content: res,
            icon: <InfoOutlined />,
            duration: 5,
        });
    };

    const translate = (text: string) => {
        console.log('text', text);
        translateSingleWords(text).then((res) => {
            success(res);
        });
    }

    const handleReset = () => {
        chrome.storage.local.remove('translatedWords', () => {
            setData([]);
        });
    }
    return (
        <div className={'words-container'}>
            {contextHolder}
            <List
                header={<div className={'words-header'}>all words that were queried <span className={'reset'} onClick={handleReset}>RESET</span></div>}
                bordered
                dataSource={data}
                renderItem={(item) => (
                    <List.Item onClick={() => translate(item)}>
                        {item}
                    </List.Item>
                )}
            />
        </div>
    )
}

export default Words
