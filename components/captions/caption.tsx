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
import useI18n from "../../utils/i18n";
import messageManager from "../../utils/message-manager";
import { useAutoTranslateContent } from "../../hooks/useAutoTranslate";
import { getCurrentTranslationProvider } from "../../hooks/useTranslationProvider";
import { translateByGoogle, translateByMicrosoft, translateByAI } from "../../utils/translators";
import { detectLanguage, isRTLLanguage } from "../../utils/language-detector";
import { setTranslatedWords } from "~utils/translate"

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
    const [isTranslating, setIsTranslating] = useState(false);
    const captionRef = useRef<HTMLDivElement>(null);
    
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

    // 滚动函数：确保整个caption-container可见
    const scrollToMakeVisible = useCallback(() => {
        setTimeout(() => {
            if (captionRef.current) {
                captionRef.current.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'nearest',
                    inline: 'nearest'
                });
            }
        }, 100); // 短暂延迟确保DOM更新完成
    }, []);

    // 使用useCallback缓存函数引用
    const success = useCallback((res: string) => {
        messageManager.success(res, 5);
    }, []);

    const error = useCallback((res: string) => {
        messageManager.error(res, 5);
    }, []);

    // 使用 useMemo 缓存高亮处理的结果，并正确指定依赖项
const captions = useMemo(() => {
        // 始终显示原文，不被翻译内容覆盖
        const displayContent = data.talkContent;
        
        // 先应用高亮效果，然后再包装单词
        let processedContent = displayContent;
        
        // 如果有高亮词汇，先应用高亮效果
        if (domainKeyWords.length > 0 || specificWords.length > 0) {
            processedContent = highlight(processedContent, [...domainKeyWords, ...specificWords]);
        }
        
        // 将文本分割成单词并包装成可点击的span，但要避免破坏已有的HTML标签
        const wrapWordsInSpans = (text: string): string => {
            // 分离HTML标签和纯文本
            const parts: Array<{type: 'html' | 'text', content: string}> = [];
            let currentIndex = 0;
            
            // 找到所有HTML标签
            const htmlTagRegex = /<[^>]+>/g;
            let match;
            
            while ((match = htmlTagRegex.exec(text)) !== null) {
                // 添加标签前的文本
                if (match.index > currentIndex) {
                    parts.push({
                        type: 'text',
                        content: text.substring(currentIndex, match.index)
                    });
                }
                
                // 添加HTML标签
                parts.push({
                    type: 'html',
                    content: match[0]
                });
                
                currentIndex = match.index + match[0].length;
            }
            
            // 添加最后剩余的文本
            if (currentIndex < text.length) {
                parts.push({
                    type: 'text',
                    content: text.substring(currentIndex)
                });
            }
            
            // 处理每个部分
            return parts.map(part => {
                if (part.type === 'html') {
                    return part.content;
                } else {
                    // 只对纯文本部分进行单词包装
                    return part.content.replace(/(\S+)/g, (word) => {
                        return `<span class="clickable-word" data-word="${word.replace(/"/g, '&quot;')}">${word}</span>`;
                    });
                }
            }).join('');
        };
        
        processedContent = wrapWordsInSpans(processedContent);
        
        return processedContent;
    }, [data.talkContent, domainKeyWords, specificWords]);

    // 改进的单词点击处理函数
    const handleWordClick = useCallback(async (event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        
        const target = event.target as HTMLElement;
        
        // 检查点击的是否是单词span或者高亮的b标签
        let clickableElement = target;
        let word = '';
        
        // 如果点击的是高亮的b标签，需要找到父级的clickable-word span
        if (target.classList.contains('highlight')) {
            // 向上查找clickable-word span
            let parent = target.parentElement;
            while (parent && !parent.classList.contains('clickable-word')) {
                parent = parent.parentElement;
            }
            if (parent && parent.classList.contains('clickable-word')) {
                clickableElement = parent;
                word = parent.getAttribute('data-word') || '';
            } else {
                // 如果没有找到clickable-word，使用高亮元素的文本内容
                word = target.textContent || '';
            }
        } else if (target.classList.contains('clickable-word')) {
            word = target.getAttribute('data-word') || '';
        } else {
            // 向上查找是否有clickable-word父元素
            let parent = target.parentElement;
            while (parent && !parent.classList.contains('clickable-word')) {
                parent = parent.parentElement;
            }
            if (parent && parent.classList.contains('clickable-word')) {
                clickableElement = parent;
                word = parent.getAttribute('data-word') || '';
            }
        }
        
        if (word && word.trim()) {
            try {
                console.log(`Clicked word: ${word}`);
              // Save the word to translation history first
              setTranslatedWords(word);
                // 获取当前翻译提供商
                const provider = await getCurrentTranslationProvider();
                console.log(`[handleWordClick] Using provider: ${provider}`);
                
                let translatedText: string;
                
                // 根据不同的提供商调用相应的翻译函数
                switch (provider) {
                    case 'google':
                        translatedText = await translateByGoogle(word);
                        break;
                    case 'microsoft':
                        translatedText = await translateByMicrosoft(word);
                        break;
                    case 'ai':
                    default:
                        translatedText = await translateByAI(word);
                        break;
                }
                
                // 显示翻译结果
                success(`${word} → ${translatedText}`);
                
            } catch (err) {
                console.error('Unexpected error in handleWordClick:', err);
                const errorMessage = typeof err === 'string' ? err : 
                                   err?.message || 'Translation failed';
                error(errorMessage);
            }
        } else {
            // 如果没有找到单词，执行整句翻译逻辑
            try {
                // 获取当前翻译提供商
                const provider = await getCurrentTranslationProvider();
                console.log(`[handleWordClick] Using provider for sentence: ${provider}`);
                
                let translatedText: string;
                
                // 根据不同的提供商调用相应的翻译函数
                switch (provider) {
                    case 'google':
                        translatedText = await translateByGoogle(data.talkContent);
                        break;
                    case 'microsoft':
                        translatedText = await translateByMicrosoft(data.talkContent);
                        break;
                    case 'ai':
                    default:
                        translatedText = await translateByAI(data.talkContent);
                        break;
                }
                
                // 显示翻译结果
                success(translatedText);
                
            } catch (err) {
                console.error('Unexpected error in handleWordClick sentence translation:', err);
                const errorMessage = typeof err === 'string' ? err : 
                                   err?.message || 'Translation failed';
                error(errorMessage);
            }
        }
    }, [data.talkContent, success, error]);

    const hasAiData = aiData.length > 0;

    // 保留原来的文本选择功能
    const handleTextSelection = useCallback(async () => {
        const selection = window.getSelection();
        const selectedText = selection?.toString().trim();

        if (selectedText && selectedText.length > 0) {
            try {
                console.log(`Selected text: ${selectedText}`);
                
                // 获取当前翻译提供商
                const provider = await getCurrentTranslationProvider();
                console.log(`[handleTextSelection] Using provider: ${provider}`);
                
                let translatedText: string;
                
                // 根据不同的提供商调用相应的翻译函数
                switch (provider) {
                    case 'google':
                        translatedText = await translateByGoogle(selectedText);
                        break;
                    case 'microsoft':
                        translatedText = await translateByMicrosoft(selectedText);
                        break;
                    case 'ai':
                    default:
                        translatedText = await translateByAI(selectedText);
                        break;
                }
                
                // 显示翻译结果
                success(`${selectedText} → ${translatedText}`);
                
            } catch (err) {
                console.error('Unexpected error in handleTextSelection:', err);
                const errorMessage = typeof err === 'string' ? err : 
                                   err?.message || 'Translation failed';
                error(errorMessage);
            }
        }
    }, [success, error]);

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
            // 滚动确保整个caption-container可见
            scrollToMakeVisible();
        }).catch((err) => {
            console.error(`Error in handleAskAI for action ${action}:`, err);
            
            // 直接显示原始错误信息
            const errorMessage = typeof err === 'string' ? err : 
                               err?.message || 'Unknown error occurred';
            
            messageManager.error(errorMessage, 5);
        });
    }, [data.talkContent, t, scrollToMakeVisible]);

    // 新的翻译处理函数 - 使用自动翻译接口
    const handleTranslate = useCallback(async () => {
        try {
            setIsTranslating(true);
            // 获取当前翻译提供商
            const provider = await getCurrentTranslationProvider();
            console.log(`[handleTranslate] Using provider: ${provider}`);
            
            let translatedText: string;
            
            // 根据不同的提供商调用相应的翻译函数
            switch (provider) {
                case 'google':
                    translatedText = await translateByGoogle(data.talkContent);
                    break;
                case 'microsoft':
                    translatedText = await translateByMicrosoft(data.talkContent);
                    break;
                case 'ai':
                default:
                    translatedText = await translateByAI(data.talkContent);
                    break;
            }
            
            // 将翻译结果添加到AI数据中显示
            setAiData(prevData => {
                const newData = [...prevData];
                const matchData = newData.find((item) => item.type === Actions.TRANSLATE);
                if (matchData) {
                    matchData.data = translatedText;
                } else {
                    newData.push({type: Actions.TRANSLATE, data: translatedText});
                }
                return newData;
            });
            
            // 滚动确保整个caption-container可见
            scrollToMakeVisible();
            
            console.log(`[handleTranslate] Translation completed: ${translatedText.substring(0, 100)}...`);
            
        } catch (error) {
            console.error('Translation error:', error);
            const errorMessage = typeof error === 'string' ? error : 
                               error?.message || 'Translation failed';
            messageManager.error(errorMessage, 5);
        } finally {
            setIsTranslating(false);
        }
    }, [data.talkContent, scrollToMakeVisible]);

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
                onClick={handleTranslate}
                loading={isTranslating}
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
    ), [handleTranslate, handleAskAI, getActionText, isTranslating]);

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


    const [isRTL, setIsRTL] = useState(false);
    useEffect(() => {
        if (isRTL) return;
        const detectedLang = detectLanguage(data.talkContent);
        const detectedIsRTL = isRTLLanguage(detectedLang);
        setIsRTL(detectedIsRTL);
    }, [isRTL, data.talkContent]);

    return (
        <div className={'caption-container'} ref={captionRef}>
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
                        className={`caption-text ${isRTL ? 'rtl' : ''}`}
                        onClick={handleWordClick}
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
