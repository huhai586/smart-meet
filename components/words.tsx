import { Typography, Button, Empty, Modal } from "antd";
import React, { useEffect, useState } from "react";
import '../styles/words.scss'
import { getTranslatedWords } from "~utils/translate";
import { 
    DeleteOutlined,
    ExclamationCircleOutlined,
    HistoryOutlined
} from '@ant-design/icons';
import { translateWord } from "~utils/unified-translation";
import { useI18n } from '../utils/i18n';
import messageManager from '../utils/message-manager';
import WordCard from './words/WordCard';
import WordDetailModal from './words/WordDetailModal';

const { Title, Text } = Typography;
const { confirm } = Modal;

interface WordTranslation {
  word: string;
  translation?: string;
  loading?: boolean;
}

const Words = (props: {currentTab: string}) => {
    const { t } = useI18n();
    const [data, setData] = useState<string[]>([]);
    const [wordTranslations, setWordTranslations] = useState<Map<string, WordTranslation>>(new Map());
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [selectedWord, setSelectedWord] = useState<string>('');

    useEffect(() => {
        console.log('Words component: Tab changed to', props.currentTab);
        getTranslatedWords().then((res) => {
            console.log('Words component: Got', res.length, 'words');
            setData(res);
            // 初始化翻译状态
            const translationMap = new Map<string, WordTranslation>();
            res.forEach(word => {
                translationMap.set(word, { word, translation: undefined, loading: false });
            });
            setWordTranslations(translationMap);
        });
    }, [props.currentTab]);

    const success = (res: string) => {
        messageManager.success(res, 5);
    };

    const error = (res: string) => {
        messageManager.error(res, 5);
    };

    const handleTranslate = async (word: string) => {
        // 更新加载状态
        setWordTranslations(prev => {
            const newMap = new Map(prev);
            newMap.set(word, { word, translation: prev.get(word)?.translation, loading: true });
            return newMap;
        });

        try {
            const translatedText = await translateWord(word);
            // 更新翻译状态
            setWordTranslations(prev => {
                const newMap = new Map(prev);
                newMap.set(word, { word, translation: translatedText, loading: false });
                return newMap;
            });
        } catch (err) {
            console.error('Translation error:', err);
            const errorMessage = typeof err === 'string' ? err : 
                               err?.message || 'Translation failed';
            error(errorMessage);
            // 更新翻译状态为错误
            setWordTranslations(prev => {
                const newMap = new Map(prev);
                newMap.set(word, { word, translation: 'Translation failed', loading: false });
                return newMap;
            });
        }
    };

    const handleShowDetail = (word: string) => {
        setSelectedWord(word);
        setDetailModalVisible(true);
    };

    const handleCloseDetail = () => {
        setDetailModalVisible(false);
        setSelectedWord('');
    };



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
            setWordTranslations(new Map());
            messageManager.success(t('history_cleared'));
        });
    };

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
                <div className="words-grid">
                    {data.map((word, index) => {
                        const wordData = wordTranslations.get(word);
                        return (
                            <WordCard
                                key={word}
                                word={word}
                                translation={wordData?.translation}
                                onTranslate={handleTranslate}
                                onShowDetail={handleShowDetail}
                            />
                        );
                    })}
                </div>
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

            <WordDetailModal
                visible={detailModalVisible}
                word={selectedWord}
                onClose={handleCloseDetail}
            />
        </div>
    )
}

export default Words
