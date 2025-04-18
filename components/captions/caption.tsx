import React, {useEffect, useState, useMemo} from "react";
import type {Transcript} from "../../hooks/useTranscripts";
import askAI from "../../utils/askAI";
import {Button, message} from "antd";
import {
    InfoOutlined,
    TranslationOutlined,
    CheckCircleOutlined,
    CodeOutlined,
    UserOutlined,
    ClockCircleOutlined
} from '@ant-design/icons';
import highlight from '../../utils/highlight';
import useHighLightWords from "../../hooks/useHighLightWords";
import useDomain from "../../hooks/useDomain";
import translateSingleWords from "~utils/translate-signal-words";
import useI18n from "../../utils/i18n";

type CaptionProps = {
    data: Transcript;
};

export enum Actions {
    TRANSLATE = 'Translate',
    EXPLAIN = 'Explain',
    POLISH = 'Polish',
    ANALYSIS = 'Analysis',
    ASK = 'Ask',
    DEFAULT = 'Default',
    SUMMARY = 'Summary',
}

const caption = (props: CaptionProps) => {
    const {data} = props;
    const [aiData, setAiData] = useState([]);
    const [captions, setCaptions] = useState(data.talkContent);
    const [messageApi, contextHolder] = message.useMessage();
    const [domainKeyWords, specificWords] = useHighLightWords();
    const [domain] = useDomain();
    const { t } = useI18n();

    // 使用 useMemo 缓存高亮处理的结果
    const highlightedText = useMemo(() => {
        const texts = data.talkContent;
        let spans = texts.replace(/\b(\w+)\b/g, '<span>\$1</span>');
        return highlight(spans,[...domainKeyWords, ...specificWords]);
    }, [data.talkContent, domainKeyWords, specificWords]);

    useEffect(() => {
        setCaptions(highlightedText);
    }, [highlightedText]);

    const handleAskAI = (action: Actions) => {
        askAI(action, data.talkContent).then((res) => {
            const newAiData = [...aiData];
            const matchData = newAiData.find((item) => item.type === action);
            if (matchData) {
                matchData.data = res;
            } else {
                newAiData.push({type: action, data: res});
            }
            setAiData(newAiData);
        }).catch((err) => {
            messageApi.error({
                content: err,
                duration: 3,
            });
        });
    };
    const success = (res: string) => {
        messageApi.destroy()
        messageApi.open({
            type: 'success',
            content: res,
            icon: <InfoOutlined />,
            duration: 5,
        });
    };

    const hasAiData= aiData.length > 0;

    // 处理文本选中事件
    const handleTextSelection = () => {
        const selection = window.getSelection();
        const selectedText = selection?.toString().trim();
        
        // 如果有选中的文本，则自动翻译
        if (selectedText && selectedText.length > 0) {
            translateSingleWords(selectedText).then((res) => {
                success(res);
            });
        }
    };

    const handleTextClick = (ev) => {
        // 如果点击的是div元素，取消后续逻辑
        if (ev.target.tagName.toLowerCase() === 'div') {
            return;
        }
        
        const text = ev.target.textContent;
        if (domainKeyWords.includes(text) && domain) {
            askAI(Actions.EXPLAIN, text, domain).then((res) => {
                success(res);
            });
            return;
        }
        translateSingleWords(text).then((res) => {
            success(res);
        });
    }
    
    // 获取操作按钮的本地化文本
    const getActionText = (action: Actions): string => {
        const actionMap = {
            [Actions.TRANSLATE]: t('translate'),
            [Actions.EXPLAIN]: t('explain'),
            [Actions.POLISH]: t('polish'),
            [Actions.ANALYSIS]: t('analysis'),
            [Actions.ASK]: t('ask'),
            [Actions.SUMMARY]: t('summary'),
            [Actions.DEFAULT]: ''
        };
        return actionMap[action] || action;
    };
    
    return (
        <div className={'caption-container'}>
            {contextHolder}
            <section>
                <div className={'caption-text-container'}>
                    <div className="caption-header">
                        <div className={'caption-speaker'}>
                            <UserOutlined style={{ fontSize: '16px', marginRight: '8px', color: '#1a73e8' }} />
                            {data.activeSpeaker}
                        </div>
                        <div className="caption-tools">
                            <Button 
                                size={'small'} 
                                icon={<TranslationOutlined />}
                                onClick={() => handleAskAI(Actions.TRANSLATE)}
                            >
                                {getActionText(Actions.TRANSLATE)}
                            </Button>

                            <Button 
                                size={'small'} 
                                icon={<CheckCircleOutlined />}
                                onClick={() => handleAskAI(Actions.POLISH)}
                            >
                                {getActionText(Actions.POLISH)}
                            </Button>

                            <Button 
                                size={'small'} 
                                icon={<CodeOutlined />}
                                onClick={() => handleAskAI(Actions.ANALYSIS)}
                            >
                                {getActionText(Actions.ANALYSIS)}
                            </Button>
                        </div>
                    </div>
                    <div 
                        className={'caption-text'} 
                        onClick={handleTextClick} 
                        onMouseUp={handleTextSelection}
                        dangerouslySetInnerHTML={{__html: captions}}
                    ></div>
                    <div className="timestamp">
                        <ClockCircleOutlined style={{ marginRight: '6px', fontSize: '12px' }} />
                        {new Date(data.timestamp).toLocaleString()}
                    </div>
                </div>
            </section>

            {hasAiData && <div className={'ai-answer-container'}>
                {aiData.map((item, index) => (
                    <div key={item.type} className={'ai-answer-item'}>
                        <div className={'ai-answer-type'}>
                            <InfoOutlined style={{ marginRight: '8px', color: '#1a73e8' }} />
                            {getActionText(item.type as Actions)}
                        </div>
                        <div className={'ai-answer-data'} dangerouslySetInnerHTML={{__html: item.data}}></div>
                    </div>
                ))}
            </div>}
        </div>
    )
}

export default caption;
