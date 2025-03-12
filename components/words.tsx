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
import { useI18n } from '../utils/i18n';

const { Title, Text } = Typography;
const { confirm } = Modal;

const Words = (props: {currentTab: string}) => {
    const { t } = useI18n();
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
            title: t('clear_history_confirm'),
            icon: <ExclamationCircleOutlined />,
            content: t('clear_history_desc'),
            okText: t('yes_clear_all'),
            okType: 'danger',
            cancelText: t('no_keep_it'),
            onOk() {
                handleReset();
            },
        });
    };

    const handleReset = () => {
        chrome.storage.local.remove('translatedWords', () => {
            setData([]);
            message.success(t('history_cleared'));
        });
    }

    return (
        <div className={'words-container'}>
            {contextHolder}
            <div className="words-header">
                <div className="header-content">
                    <div className="title-section">
                        <HistoryOutlined className="header-icon" />
                        <Title level={4}>{t('translation_history')}</Title>
                    </div>
                    <Button 
                        type="text"
                        size="small"
                        className="reset-btn"
                        onClick={showConfirm}
                    >
                        {t('reset')}
                    </Button>
                </div>
                <Text type="secondary">{t('click_to_translate')}</Text>
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
                            {t('no_history')}
                        </Text>
                    }
                />
            )}
        </div>
    )
}

export default Words
