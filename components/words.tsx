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
import messageManager from '../utils/message-manager';

const { Title, Text } = Typography;
const { confirm } = Modal;

const Words = (props: {currentTab: string}) => {
    const { t } = useI18n();
    const [data, setData] = useState([]);

    useEffect(() => {
        getTranslatedWords().then((res) => {
            setData(res);
        });
    }, [props.currentTab]);

    const success = (res: string) => {
        messageManager.success(res, 5);
    };

    const error = (res: string) => {
        messageManager.error(res, 5);
    };

    const translate = (text: string) => {
        translateSingleWords(text).then((res) => {
            // Check if the response is an error message by looking for translation keys
            const isErrorMessage = res.includes(t('translation_failed')) || 
                                  res.includes(t('translation_service_not_configured')) ||
                                  res.includes(t('translation_network_error')) ||
                                  res.includes(t('translation_service_unavailable'));
                                  
            if (isErrorMessage) {
                error(res);
            } else {
                success(res);
            }
        }).catch((err) => {
            // This should not happen now since translateSingleWords handles errors
            console.error('Unexpected error in translate:', err);
            error(t('unexpected_error'));
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
            messageManager.success(t('history_cleared'));
        });
    }

    return (
        <div className={'words-container'}>
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
