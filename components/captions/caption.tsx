import React, { useEffect, useState, memo, useRef, useCallback } from "react";
import type { Transcript } from "../../hooks/useTranscripts";
import useHighLightWords from "../../hooks/useHighLightWords";
import { useAutoTranslateContent } from "../../hooks/useAutoTranslate";
import { useTranslation, useAIInteraction, useLanguageDetection } from "./hooks";
import { CaptionHeader, AutoTranslationSection, CaptionTimestamp, AIAnswerSection } from "./components";
import { CaptionTextRenderer } from "./components/CaptionTextRenderer";
import { Actions } from "~components/captions/types";
import { scrollElementIntoView } from "~components/captions/utils/scrollUtils"

type CaptionProps = {
    data: Transcript;
    disableAutoScroll: () => void;
};

// Main component extracted to external to avoid recreating internal functions on each re-render
const Caption = memo((props: CaptionProps) => {
    const { data, disableAutoScroll } = props;
    const [isTranslating, setIsTranslating] = useState(false);
    const captionRef = useRef<HTMLDivElement>(null);
    
    // Custom hooks
    const [domainKeyWords, specificWords] = useHighLightWords();
    const { autoTranslatedContent, cleanup } = useAutoTranslateContent(data.talkContent, data.timestamp);
    
    // Translation functionality
    const { handleWordClick, handleTextSelection, handleManualTranslation } = useTranslation();

    // AI interaction
    const { aiData, hasAiData, handleAskAI, addTranslationToAIData, lastActionType } = useAIInteraction();
    
    // Language detection
    const isRTL = useLanguageDetection(data.talkContent);
    const isAutoTranslateLanguageRTL = useLanguageDetection(autoTranslatedContent || '');

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cleanup();
        };
    }, [cleanup]);

  useEffect(() => {
    if(!captionRef.current || aiData.length === 0) {
        return;
    }
      setTimeout(() => {
        scrollElementIntoView(captionRef.current)
      }, 1000);
    }, [aiData, captionRef])

    // Handle translation with loading state
    const handleTranslate = async () => {
        try {
            disableAutoScroll(); // Disable auto scroll when user clicks translate
            setIsTranslating(true);
            const translatedText = await handleManualTranslation(data.talkContent);
            addTranslationToAIData(translatedText);
        } catch (error) {
            console.error('Translation error:', error);
        } finally {
            setIsTranslating(false);
        }
    };

    // Handle AI requests
    const onAskAI = (action: Actions) => {
        disableAutoScroll(); // Disable auto scroll when user clicks AI actions
        handleAskAI(action, data.talkContent);
    };

    // Handle word/text clicks - only respond to clickable-word elements
    const onWordClick = (event: React.MouseEvent) => {
        const target = event.target as HTMLElement;
        
        // Only process if clicked on or inside a clickable-word element
        const clickableWord = target.closest('.clickable-word');
        if (!clickableWord) {
            return; // Ignore clicks outside clickable-word elements
        }
        
        handleWordClick(event, data.talkContent);
    };

    // Handle sentence translation from hover - use same message style as word click
    const handleSentenceTranslation = useCallback(async (sentence: string): Promise<void> => {
        const messageManager = (await import('../../utils/message-manager')).default;
        const { getCurrentTranslationProvider } = await import('../../hooks/useTranslationProvider');
        const { translateByGoogle, translateByMicrosoft, translateByAI } = await import('../../utils/translators');
        
        try {
            disableAutoScroll();
            
            // Get translation provider and translate
            const provider = await getCurrentTranslationProvider();
            let translatedText: string;
            
            switch (provider) {
                case 'google':
                    translatedText = await translateByGoogle(sentence);
                    break;
                case 'microsoft':
                    translatedText = await translateByMicrosoft(sentence);
                    break;
                case 'ai':
                default:
                    translatedText = await translateByAI(sentence);
                    break;
            }
            
            // Show only the translation result, not the original text
            messageManager.success(translatedText, 5);
            
        } catch (error) {
            console.error('Sentence translation error:', error);
            const errorMessage = typeof error === 'string' ? error : 
                               (error as any)?.message || 'Translation failed';
            messageManager.error(errorMessage, 5);
        }
    }, [disableAutoScroll]);

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
                    
                    <div onClick={onWordClick} onMouseUp={handleTextSelection}>
                        <CaptionTextRenderer
                            content={data.talkContent}
                            domainKeyWords={domainKeyWords}
                            specificWords={specificWords}
                            isRTL={isRTL}
                            onTranslateSentence={handleSentenceTranslation}
                        />
                    </div>
                    
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

Caption.displayName = 'Caption';

export default Caption;
