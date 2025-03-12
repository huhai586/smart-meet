import {Card, message, Spin} from "~node_modules/antd";
import {LoadingOutlined} from "~node_modules/@ant-design/icons";
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

interface CardItem {
    question: string;
    answer: string;
    fetchComplete: boolean;
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
    const [markdownErrors, setMarkdownErrors] = useState<Record<string, boolean>>({});

    const handleQuestion = async (question = t('summary_question')) => {
        const recordedContents = await getMeetingCaptions(selectedDate);
        if (recordedContents.length === 0) {
            messageApi.open({
                type: 'error',
                content: t('no_meeting_data'),
            });
            return
        }
        setCardData([...cardData, {question, answer: '', fetchComplete: false}]);
    }

    useEffect(() => {
        console.log('cardData', cardData);
        cardData.forEach((item, index) => {
            if (item.fetchComplete) {
                return;
            }
            setRequesting(true);
            getAiSummary(item.question).then((res) => {
                const newCardData = [...cardData];
                newCardData[index].answer = res;
                newCardData[index].fetchComplete = true;
                setCardData(newCardData);
            }).catch((err) => {
                messageApi.open({
                    type: 'error',
                    content: err,
                });
            }).finally(() => {
                setRequesting(false);
            })
        });
    }, [cardData, props.show]);

    useEffect(() =>  {
        if (container.current) {
            const lastItem = container.current.querySelector('.ant-spin-nested-loading:last-child');
            lastItem && lastItem.scrollIntoView({behavior: 'smooth'});
        }
    },[cardData])

    const handleMarkdownError = (itemId: string) => {
        setMarkdownErrors(prev => ({
            ...prev,
            [itemId]: true
        }));
    };

    return <>
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
                            title={item.question}
                            key={index}
                            className={'card-container'}
                        >
                            <div className="summary-container">
                                <MarkdownErrorBoundary
                                    fallback={<div dangerouslySetInnerHTML={{ __html: item.answer }} />}
                                >
                                    <ReactMarkdown>{item.answer}</ReactMarkdown>
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

        <div className="footer" style={{ padding: '16px', position: 'sticky', bottom: 0, background: '#fff', zIndex: 1 }}>
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
    </>
}

export default Summary;
