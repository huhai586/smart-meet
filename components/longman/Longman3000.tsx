import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Input, Empty, Typography, Button, Space, Card, Progress, Statistic, Row, Col, Tooltip } from 'antd';
import { SearchOutlined, StarOutlined, StarFilled, BookOutlined, TrophyOutlined, SoundOutlined, EyeOutlined, MoreOutlined } from '@ant-design/icons';
import List from 'rc-virtual-list';
import { longman3000 } from './longman3000Data';
import WordDetailModal from '../words/WordDetailModal';
import { translateWord } from '~utils/unified-translation';
import { useI18n } from '~utils/i18n';
import messageManager from '~utils/message-manager';
import './Longman3000.scss';

const { Title, Text } = Typography;

// 自定义单词项组件，更加轻量且紧凑
const LongmanWordItem: React.FC<{
    word: string;
    isStarred: boolean;
    translation?: string;
    onToggleStar: (word: string, e: React.MouseEvent) => void;
    onTranslate: (word: string) => void;
    onShowDetail: (word: string) => void;
}> = ({ word, isStarred, translation, onToggleStar, onTranslate, onShowDetail }) => {
    const { t } = useI18n();
    const [revealTranslation, setRevealTranslation] = useState(false);

    const handleSpeak = (e: React.MouseEvent) => {
        e.stopPropagation();
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(word);
            utterance.lang = 'en-US';
            speechSynthesis.speak(utterance);
        }
    };

    const handleReveal = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!translation) {
            await onTranslate(word);
        }
        setRevealTranslation(!revealTranslation);
    };

    return (
        <div className="longman-item-row" onClick={() => onShowDetail(word)}>
            <div className="item-prefix">
                <span className="word-name">{word}</span>
                <Tooltip title={t('pronunciation')}>
                    <SoundOutlined className="action-icon speaker" onClick={handleSpeak} />
                </Tooltip>
            </div>

            <div className="item-center" onClick={(e) => { e.stopPropagation(); handleReveal(e); }}>
                {revealTranslation && translation ? (
                    <Text className="translation-fade-in" type="secondary">{translation}</Text>
                ) : (
                    <div className="reveal-placeholder">
                        <EyeOutlined className="reveal-icon" />
                        <span>{t('click_to_translate')}</span>
                    </div>
                )}
            </div>

            <div className="item-actions">
                <div className="star-wrapper" onClick={(e) => onToggleStar(word, e)}>
                    {isStarred ? <StarFilled className="star-icon active" /> : <StarOutlined className="star-icon" />}
                </div>
                <MoreOutlined className="action-icon more" onClick={(e) => { e.stopPropagation(); onShowDetail(word); }} />
            </div>
        </div>
    );
};

const Longman3000: React.FC = () => {
    const { t } = useI18n();
    const [searchText, setSearchText] = useState('');
    const [starredWords, setStarredWords] = useState<Set<string>>(new Set());
    const [showOnlyStarred, setShowOnlyStarred] = useState(false);
    const [wordTranslations, setWordTranslations] = useState<Map<string, string>>(new Map());
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [selectedWord, setSelectedWord] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerHeight, setContainerHeight] = useState(500);

    // 动态调整虚拟滚动容器高度
    useEffect(() => {
        const updateHeight = () => {
            if (containerRef.current) {
                setContainerHeight(containerRef.current.offsetHeight - 20); // 留一点 padding
            }
        };
        updateHeight();
        window.addEventListener('resize', updateHeight);
        return () => window.removeEventListener('resize', updateHeight);
    }, []);

    // 加载收藏夹
    useEffect(() => {
        chrome.storage.sync.get(['longmanStarred'], (result) => {
            if (result.longmanStarred) {
                setStarredWords(new Set(result.longmanStarred));
            }
        });
    }, []);

    // 保存收藏夹
    const saveStarred = (newStarred: Set<string>) => {
        setStarredWords(newStarred);
        chrome.storage.sync.set({ longmanStarred: Array.from(newStarred) });
    };

    const toggleStar = (word: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newStarred = new Set(starredWords);
        if (newStarred.has(word)) {
            newStarred.delete(word);
            messageManager.success(t('removed_from_starred'));
        } else {
            newStarred.add(word);
            messageManager.success(t('added_to_starred'));
        }
        saveStarred(newStarred);
    };

    const handleTranslate = async (word: string) => {
        try {
            const translatedText = await translateWord(word);
            setWordTranslations(prev => {
                const newMap = new Map(prev);
                newMap.set(word, translatedText);
                return newMap;
            });
        } catch (err) {
            console.error('Longman3000 translation error:', err);
            messageManager.error(t('translation_failed'));
        }
    };

    const handleShowDetail = (word: string) => {
        setSelectedWord(word);
        setDetailModalVisible(true);
    };

    const filteredWords = useMemo(() => {
        let result = longman3000;
        if (showOnlyStarred) {
            result = result.filter(word => starredWords.has(word));
        }
        if (searchText.trim()) {
            const lowerSearch = searchText.toLowerCase();
            result = result.filter(word => word.toLowerCase().includes(lowerSearch));
        }
        return result;
    }, [searchText, showOnlyStarred, starredWords]);

    const masteryPercent = Math.round((starredWords.size / longman3000.length) * 100);

    return (
        <div className="longman-container">
            <div className="longman-header">
                <div className="stats-dashboard">
                    <Row gutter={12}>
                        <Col span={12}>
                            <Card className="stat-card" bordered={false}>
                                <Statistic
                                    title={t('total_vocabulary')}
                                    value={longman3000.length}
                                    prefix={<BookOutlined />}
                                    valueStyle={{ color: '#0ea5e9', fontSize: '18px' }}
                                />
                            </Card>
                        </Col>
                        <Col span={12}>
                            <Card className="stat-card" bordered={false}>
                                <Statistic
                                    title={t('starred_words')}
                                    value={starredWords.size}
                                    prefix={<TrophyOutlined />}
                                    valueStyle={{ color: '#f59e0b', fontSize: '18px' }}
                                />
                            </Card>
                        </Col>
                    </Row>
                    <div className="progress-section">
                        <Progress
                            percent={masteryPercent}
                            size="small"
                            status="active"
                            strokeColor={{ '0%': '#10b981', '100%': '#0ea5e9' }}
                            showInfo={false}
                        />
                        <div className="progress-text">
                            {masteryPercent}% {t('mastered')}
                        </div>
                    </div>
                </div>

                <div className="search-and-filter">
                    <Input
                        placeholder={t('search_words')}
                        prefix={<SearchOutlined />}
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                        allowClear
                        className="search-input"
                    />
                    <Button
                        type={showOnlyStarred ? "primary" : "default"}
                        icon={showOnlyStarred ? <StarFilled /> : <StarOutlined />}
                        onClick={() => setShowOnlyStarred(!showOnlyStarred)}
                        className="filter-btn"
                    >
                        {showOnlyStarred ? t('starred') : t('all')}
                    </Button>
                </div>
            </div>

            <div className="longman-content virtual-scroll-container" ref={containerRef}>
                {filteredWords.length > 0 ? (
                    <List
                        data={filteredWords}
                        height={containerHeight}
                        itemHeight={64}
                        itemKey={(item) => item}
                    >
                        {(word) => (
                            <LongmanWordItem
                                key={word}
                                word={word}
                                isStarred={starredWords.has(word)}
                                translation={wordTranslations.get(word)}
                                onToggleStar={toggleStar}
                                onTranslate={handleTranslate}
                                onShowDetail={handleShowDetail}
                            />
                        )}
                    </List>
                ) : (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={t('no_words_found')}
                        style={{ marginTop: 40 }}
                    />
                )}
            </div>

            <WordDetailModal
                visible={detailModalVisible}
                word={selectedWord}
                onClose={() => setDetailModalVisible(false)}
            />
        </div>
    );
};

export default Longman3000;
