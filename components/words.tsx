import { List, Typography, Button, Empty, Modal } from "antd";
import React, { useEffect, useState } from "react";
import '../styles/words.scss'
import { getTranslatedWords } from "~utils/translate";
import { 
    InfoOutlined, 
    TranslationOutlined, 
    DeleteOutlined,
    ExclamationCircleOutlined,
    HistoryOutlined
} from '@ant-design/icons';
import { message } from "antd";
import translateSingleWords from "~utils/translate-signal-words";

const { Title, Text } = Typography;
const { confirm } = Modal;

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
        translateSingleWords(text).then((res) => {
            success(res);
        });
    }

    const showConfirm = () => {
        confirm({
            title: 'Are you sure you want to clear all translation history?',
            icon: <ExclamationCircleOutlined />,
            content: 'This action cannot be undone.',
            okText: 'Yes, Clear All',
            okType: 'danger',
            cancelText: 'No, Keep It',
            onOk() {
                handleReset();
            },
        });
    };

    const handleReset = () => {
        chrome.storage.local.remove('translatedWords', () => {
            setData([]);
            message.success('Translation history cleared successfully');
        });
    }

    return (
        <div className={'words-container'}>
            {contextHolder}
            <div className="words-header">
                <div className="header-content">
                    <div className="title-section">
                        <HistoryOutlined className="header-icon" />
                        <Title level={4}>Translation History</Title>
                    </div>
                    <Button 
                        type="text"
                        size="small"
                        className="reset-btn"
                        onClick={showConfirm}
                    >
                        Reset
                    </Button>
                </div>
                <Text type="secondary">Click on any word to see its translation again</Text>
            </div>

            {data.length > 0 ? (
                <List
                    className="words-list"
                    dataSource={data}
                    renderItem={(item) => (
                        <List.Item 
                            onClick={() => translate(item)}
                            className="word-item"
                        >
                            <div className="word-content">
                                <Text>{item}</Text>
                                <TranslationOutlined className="translate-icon" />
                            </div>
                        </List.Item>
                    )}
                />
            ) : (
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                        <Text type="secondary">
                            No translation history yet. Click on any word in the captions to translate it.
                        </Text>
                    }
                />
            )}
        </div>
    )
}

export default Words
