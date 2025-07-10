import React, {useEffect, useState, useMemo, memo, useCallback, useRef} from "react";
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
import messageManager from "../../utils/message-manager";
import { useAutoTranslateContent } from "../../hooks/useAutoTranslate";

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
    const {data} = props;

    const [aiData, setAiData] = useState([]);
    const [domainKeyWords, specificWords] = useHighLightWords();
    const [domain] = useDomain();
    const { t } = useI18n();
    
    // 使用自动翻译hook
    const { autoTranslatedContent, isAutoTranslating, cleanup } = useAutoTranslateContent(data.talkContent, data.timestamp);

    // 监听自动翻译内容变化，触发滚动更新
    useEffect(() => {
        if (autoTranslatedContent) {
            // 使用 requestAnimationFrame 确保DOM更新完成后触发事件
            requestAnimationFrame(() => {
                // 派发自定义事件，通知父组件内容高度可能发生变化
                const event = new CustomEvent('captionContentChanged', {
                    detail: { session: data.session, hasTranslation: true }
                });
                window.dispatchEvent(event);
            });
        }
    }, [autoTranslatedContent, data.session]);

    // 监听AI回答内容变化，触发滚动更新
    useEffect(() => {
        if (aiData.length > 0) {
            // 使用 requestAnimationFrame 确保DOM更新完成后触发事件
            requestAnimationFrame(() => {
                // 派发自定义事件，通知父组件内容高度可能发生变化
                const event = new CustomEvent('captionContentChanged', {
                    detail: { session: data.session, hasAiContent: true }
                });
                window.dispatchEvent(event);
            });
        }
    }, [aiData, data.session]);

    // 组件卸载时清理自动翻译状态
    useEffect(() => {
        return () => {
            cleanup();
        };
    }, [cleanup]);

    // 使用 useMemo 缓存高亮处理的结果，并正确指定依赖项
    const captions = useMemo(() => {

        
        // 始终显示原文，不被翻译内容覆盖
        const displayContent = data.talkContent;
        
        if (domainKeyWords.length > 0 || specificWords.length > 0) {
          let spans = displayContent.replace(/\b(\w+)\b/g, '<span>$1</span>');
          return highlight(spans,[...domainKeyWords, ...specificWords]);
        }
        return displayContent;
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
            console.error(`Error in handleAskAI for action ${action}:`, err);
            
            // 直接显示原始错误信息
            const errorMessage = typeof err === 'string' ? err : 
                               err?.message || 'Unknown error occurred';
            
            messageManager.error(errorMessage, 5);
        });
    }, [data.talkContent, t]);

    // 使用useCallback缓存函数引用
    const success = useCallback((res: string) => {
        messageManager.success(res, 5);
    }, []);

    const error = useCallback((res: string) => {
        messageManager.error(res, 5);
    }, []);

    const hasAiData = aiData.length > 0;

    // 使用useCallback缓存事件处理函数
    const handleTextSelection = useCallback(() => {
        const selection = window.getSelection();
        const selectedText = selection?.toString().trim();

        if (selectedText && selectedText.length > 0) {
            translateSingleWords(selectedText).then((res) => {
                // 检查是否是错误信息（以"Translation failed:"开头）
                if (res.startsWith('Translation failed:')) {
                    error(res);
                } else {
                    success(res);
                }
            }).catch((err) => {
                console.error('Unexpected error in handleTextSelection:', err);
                const errorMessage = typeof err === 'string' ? err : 
                                   err?.message || 'Unknown error occurred';
                error(errorMessage);
            });
        }
    }, [success, error]);

    const handleTextClick = useCallback(() => {
        translateSingleWords(data.talkContent).then((res) => {
            // 检查是否是错误信息（以"Translation failed:"开头）
            if (res.startsWith('Translation failed:')) {
                error(res);
            } else {
                success(res);
            }
        }).catch((err) => {
            console.error('Unexpected error in handleTextClick:', err);
            const errorMessage = typeof err === 'string' ? err : 
                               err?.message || 'Unknown error occurred';
            error(errorMessage);
        });
    }, [data.talkContent, success, error]);

    // 使用useMemo缓存按钮操作文本
    const getActionText = useCallback((action: Actions): string => {
        const actionMap = {
            [Actions.TRANSLATE]: t('translate'),
            [Actions.EXPLAIN]: t('explain'),
            [Actions.POLISH]: t('polish'),
            [Actions.ANALYSIS]: t('analysis'),
            [Actions.ASK]: t('ask'),
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
                loading={isAutoTranslating}
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
    ), [handleAskAI, getActionText, isAutoTranslating]);

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
                    
                    {/* 自动翻译内容显示区域 */}
                    {autoTranslatedContent && (
                        <div className={'auto-translation-container'} style={{
                            marginTop: '8px',
                            padding: '8px 12px',
                            backgroundColor: '#f0f8ff',
                            borderLeft: '3px solid #1a73e8',
                            borderRadius: '4px',
                            fontSize: '14px',
                            color: '#333'
                        }}>
                            <div style={{ 
                                fontSize: '12px', 
                                color: '#1a73e8', 
                                marginBottom: '4px',
                                fontWeight: '500'
                            }}>
                                {t('auto_translated')}
                            </div>
                            <div dangerouslySetInnerHTML={{__html: autoTranslatedContent}}></div>
                        </div>
                    )}
                    
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

    return propsEqual;
});

export default Caption;
