import React, {useEffect, useState, useMemo, memo, useCallback} from "react";
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

// 组件主体提取到外部，避免每次重新渲染时重新创建内部函数
const Caption = memo((props: CaptionProps) => {
    console.count("rendering");
    const {data} = props;
    
    const [aiData, setAiData] = useState([]);
    const [domainKeyWords, specificWords] = useHighLightWords();
    const [domain] = useDomain();
    const { t } = useI18n();
    const [messageApi, contextHolder] = message.useMessage();

    // 使用 useMemo 缓存高亮处理的结果，并正确指定依赖项
    const captions = useMemo(() => {
        console.log('Computing caption highlight', {
            contentLength: data.talkContent ? data.talkContent.length : 0,
            domainKeyWordsLength: domainKeyWords.length,
            specificWordsLength: specificWords.length
        });
        const texts = data.talkContent;
        if (domainKeyWords.length > 0 || specificWords.length > 0) {
          let spans = texts.replace(/\b(\w+)\b/g, '<span>\$1</span>');
          return highlight(spans,[...domainKeyWords, ...specificWords]);
        }
        return texts;
    }, [data.talkContent, domainKeyWords, specificWords]);

    // 使用useCallback缓存函数引用
    const handleAskAI = useCallback((action: Actions) => {
        askAI(action, data.talkContent).then((res) => {
            setAiData(prevData => {
                const newData = [...prevData];
                const matchData = newData.find((item) => item.type === action);
                if (matchData) {
                    matchData.data = res;
                } else {
                    newData.push({type: action, data: res});
                }
                return newData;
            });
        }).catch((err) => {
            messageApi.error({
                content: err,
                duration: 3,
            });
        });
    }, [data.talkContent, messageApi]);

    // 使用useCallback缓存函数引用
    const success = useCallback((res: string) => {
        messageApi.destroy();
        messageApi.open({
            type: 'success',
            content: res,
            icon: <InfoOutlined />,
            duration: 5,
        });
    }, [messageApi]);

    const hasAiData = aiData.length > 0;

    // 使用useCallback缓存事件处理函数
    const handleTextSelection = useCallback(() => {
        const selection = window.getSelection();
        const selectedText = selection?.toString().trim();

        if (selectedText && selectedText.length > 0) {
            translateSingleWords(selectedText).then(success);
        }
    }, [success]);

    // 使用useCallback缓存事件处理函数
    const handleTextClick = useCallback((ev) => {
        if (ev.target.tagName.toLowerCase() === 'div') {
            return;
        }

        const text = ev.target.textContent;
        if (domainKeyWords.includes(text) && domain) {
            askAI(Actions.EXPLAIN, text, domain).then(success);
            return;
        }
        translateSingleWords(text).then(success);
    }, [domainKeyWords, domain, success]);

    // 使用useMemo缓存按钮操作文本
    const getActionText = useCallback((action: Actions): string => {
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
    }, [t]);

    // 使用useMemo缓存按钮组，避免重新渲染
    const actionButtons = useMemo(() => (
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
    ), [handleAskAI, getActionText]);

    // 使用useMemo缓存AI回答部分
    const aiAnswerSection = useMemo(() => {
        if (!hasAiData) return null;
        
        return (
            <div className={'ai-answer-container'}>
                {aiData.map((item, index) => (
                    <div key={item.type} className={'ai-answer-item'}>
                        <div className={'ai-answer-type'}>
                            <InfoOutlined style={{ marginRight: '8px', color: '#1a73e8' }} />
                            {getActionText(item.type as Actions)}
                        </div>
                        <div className={'ai-answer-data'} dangerouslySetInnerHTML={{__html: item.data}}></div>
                    </div>
                ))}
            </div>
        );
    }, [aiData, hasAiData, getActionText]);

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
                        {actionButtons}
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
            {aiAnswerSection}
        </div>
    );
}, (prevProps, nextProps) => {
    // 详细比较props中的所有关键字段，而不仅仅是长度
    const propsEqual = 
        prevProps.data.session === nextProps.data.session &&
        prevProps.data.timestamp === nextProps.data.timestamp &&
        prevProps.data.talkContent === nextProps.data.talkContent;
    
    console.log('Caption memo compare:', 
        prevProps.data.session, nextProps.data.session,
        prevProps.data.timestamp, nextProps.data.timestamp,
        Boolean(propsEqual)
    );
    
    return propsEqual;
});

export default Caption;
