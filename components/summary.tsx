import {Card, message, Spin, Badge, Tag} from "~node_modules/antd";
import {LoadingOutlined, MessageOutlined, QuestionCircleOutlined} from "~node_modules/@ant-design/icons";
import React, {useEffect, useRef, useState} from "react";
import getAiSummary from "../utils/get-ai-summary";
import Search from "~node_modules/antd/es/input/Search";
import getMeetingCaptions from '../utils/getCaptions';
import {Empty} from 'antd';
import '../styles/summary.scss';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'
import { useDateContext } from '../contexts/DateContext';
import { useI18n } from '../utils/i18n';
import googleAITools from "~utils/google-AI"
import { Actions } from "~components/captions/caption"

interface CardItem {
    question: string;
    answer: string;
    fetchComplete: boolean;
    createdAt?: number;
}

class MarkdownErrorBoundary extends React.Component<
    { children: React.ReactNode, fallback: React.ReactNode },
    { hasError: boolean }
> {
    constructor(props: { children: React.ReactNode, fallback: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback;
        }

        return this.props.children;
    }
}

const Summary = (props) => {
    const { t } = useI18n();
    const [requesting, setRequesting] = useState(false);
    const container = useRef(null);
    const [messageApi, contextHolder] = message.useMessage();
    const [cardData, setCardData] = useState<CardItem[]>([]);
    const { selectedDate } = useDateContext();

    const handleQuestion = async (question = t('summary_question')) => {
        const newCardData = [...cardData, {
            question, 
            answer: '', 
            fetchComplete: false,
            createdAt: Date.now()
        }];
        setCardData(newCardData);
    }
  useEffect(() => {
    // 添加错误处理，防止清理对话时出现问题
    try {
      console.log('Clearing AI conversation due to date change');
      googleAITools.clearConversation(Actions.ASK);

      // 清空当前显示的卡片数据
      setCardData([]);
    } catch (error) {
      console.error('Error clearing AI conversation:', error);
      messageApi.error({
        content: t('error_clearing_conversation') || 'Error clearing conversation',
        duration: 3,
      });
    }
  }, [selectedDate]);
    useEffect(() => {
        console.log('cardData', cardData);
        cardData.forEach((item, index) => {
            if (item.fetchComplete) {
                return;
            }
            const newCardData = [...cardData];
            setRequesting(true);
            getAiSummary(item.question).then((res) => {
                newCardData[index].answer = res;
                newCardData[index].fetchComplete = true;
            }).catch((err) => {
                console.warn('err', err);
                newCardData[index].fetchComplete = true;
                messageApi.open({
                    type: 'error',
                    content: err,
                });
            }).finally(() => {
                setRequesting(false);
                setCardData(newCardData);
            })
        });
    }, [cardData, props.show]);

    useEffect(() =>  {
        if (container.current) {
            const lastItem = container.current.querySelector('.ant-spin-nested-loading:last-child');
            lastItem && lastItem.scrollIntoView({behavior: 'smooth'});
        }
    },[cardData])

    // 格式化时间显示
    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    };

    return (
        <div className="summary-wrapper">
            <div className={`summaryContainer ${!cardData.length &&  'no-data'}`} ref={container}>
                {contextHolder}
                {cardData.map((item, index) => {
                    return (
                        <Spin
                            spinning={requesting && !item.fetchComplete}
                            indicator={<LoadingOutlined spin/>}
                            size="large"
                            fullscreen={false}
                            tip={t('loading')}
                            key={index}
                        >
                            <Card
                                title={
                                    <div className="card-title-container">
                                        <QuestionCircleOutlined className="card-title-icon" />
                                        <span>{item.question}</span>
                                        {item.createdAt && (
                                            <Tag color="blue" className="card-time-tag">
                                                {formatTime(item.createdAt)}
                                            </Tag>
                                        )}
                                    </div>
                                }
                                key={index}
                                className={'card-container'}
                                extra={<Badge status={item.fetchComplete ? "success" : "processing"} text={item.fetchComplete ? t('completed') : t('loading')} />}
                            >
                                <div className="summary-container">
                                    {item.fetchComplete && <MessageOutlined className="response-icon" />}
                                    <MarkdownErrorBoundary
                                        fallback={<div dangerouslySetInnerHTML={{ __html: item.answer }} />}
                                    >
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.answer}</ReactMarkdown>
                                    </MarkdownErrorBoundary>
                                </div>
                            </Card>
                        </Spin>
                    )
                })}
                {
                    !cardData.length && <Empty description={t('summary_question')} className={'summary-no-meeting-data'}></Empty>
                }
            </div>

            <div className="footer">
                <Search
                    disabled={requesting}
                    placeholder={t('summary_placeholder')}
                    enterButton={t('search_button')}
                    size="large"
                    onSearch={(v) => {
                        handleQuestion(v === '' ? t('summary_question') : v);
                    }}
                />
            </div>
        </div>
    )
}

export default Summary;
