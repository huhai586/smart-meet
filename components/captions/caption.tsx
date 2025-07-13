import React, { useEffect, useState, memo, useRef } from "react";
import type { Transcript } from "../../hooks/useTranscripts";
import useHighLightWords from "../../hooks/useHighLightWords";
import useDomain from "../../hooks/useDomain";
import { useAutoTranslateContent } from "../../hooks/useAutoTranslate";
import { useCaptionText, useTranslation, useAIInteraction, useLanguageDetection } from "./hooks";
import { useScrollToVisible, useContentChangeEvents } from "./utils";
import { CaptionHeader, AutoTranslationSection, CaptionTimestamp, AIAnswerSection } from "./components";
import { Actions } from "~components/captions/types";

type CaptionProps = {
    data: Transcript;
};

// Main component extracted to external to avoid recreating internal functions on each re-render
const Caption = memo((props: CaptionProps) => {
    const { data } = props;
    const [isTranslating, setIsTranslating] = useState(false);
    const captionRef = useRef<HTMLDivElement>(null);
    
    // Custom hooks
    const [domainKeyWords, specificWords] = useHighLightWords();
    const [domain] = useDomain();
    const { autoTranslatedContent, isAutoTranslating, cleanup } = useAutoTranslateContent(data.talkContent, data.timestamp);

    // Text processing
    const processedContent = useCaptionText(data.talkContent, domainKeyWords, specificWords);
    
    // Translation functionality
    const { handleWordClick, handleTextSelection, handleManualTranslation } = useTranslation();
    
    // Scroll functionality
    const scrollToMakeVisible = useScrollToVisible(captionRef);

    // AI interaction
    const { aiData, hasAiData, handleAskAI, addTranslationToAIData, lastActionType } = useAIInteraction(scrollToMakeVisible);
    
    // Language detection
    const isRTL = useLanguageDetection(data.talkContent);
    const isAutoTranslateLanguageRTL = useLanguageDetection(autoTranslatedContent || '');
    
    // Content change events
    useContentChangeEvents(autoTranslatedContent, aiData.length, data.session);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cleanup();
        };
    }, [cleanup]);

    // Handle translation with loading state
    const handleTranslate = async () => {
        try {
            setIsTranslating(true);
            const translatedText = await handleManualTranslation(data.talkContent);
            addTranslationToAIData(translatedText);
            console.log(`[handleTranslate] Translation completed: ${translatedText.substring(0, 100)}...`);
        } catch (error) {
            console.error('Translation error:', error);
        } finally {
            setIsTranslating(false);
        }
    };

    // Handle AI requests
    const onAskAI = (action: Actions) => {
        handleAskAI(action, data.talkContent);
    };

    // Handle word/text clicks
    const onWordClick = (event: React.MouseEvent) => {
        handleWordClick(event, data.talkContent);
    };

    return (
        <div className={'caption-container'} ref={captionRef}>
            <section>
                <div className={'caption-text-container'}>
                    <CaptionHeader
                        activeSpeaker={data.activeSpeaker}
                        onTranslate={handleTranslate}
                        onAskAI={onAskAI}
                        isTranslating={isTranslating}
                    />
                    
                    <div
                        className={`caption-text ${isRTL ? 'rtl' : ''}`}
                        onClick={onWordClick}
                        onMouseUp={handleTextSelection}
                        dangerouslySetInnerHTML={{__html: processedContent}}
                    />
                    
                    <AutoTranslationSection
                        autoTranslatedContent={autoTranslatedContent}
                        isRTL={isAutoTranslateLanguageRTL}
                    />
                    
                    <CaptionTimestamp timestamp={data.timestamp} />
                </div>
            </section>
            
            <AIAnswerSection
                aiData={aiData}
                hasAiData={hasAiData}
                lastActionType={lastActionType}
            />
        </div>
    );
}, (prevProps, nextProps) => {
    // Detailed comparison of all key fields in props, not just length
    const propsEqual =
        prevProps.data.session === nextProps.data.session &&
        prevProps.data.timestamp === nextProps.data.timestamp &&
        prevProps.data.talkContent === nextProps.data.talkContent;

    return propsEqual;
});

export default Caption;
