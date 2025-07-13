import { useState, useCallback } from 'react';
import askAI from '../../../utils/askAI';
import messageManager from '../../../utils/message-manager';
import { Actions } from '~components/captions/types';
import type { AIDataItem } from '~components/captions/types';

export const useAIInteraction = (scrollToMakeVisible: () => void) => {
    const [aiData, setAiData] = useState<AIDataItem[]>([]);
    const [lastActionType, setLastActionType] = useState<Actions | undefined>(undefined);

    // Handle AI requests
    const handleAskAI = useCallback((action: Actions, content: string) => {
        askAI(action, content).then((res) => {
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
            // Set the last action type only after we get the data
            setLastActionType(action);
            // Scroll to make the entire caption-container visible
            scrollToMakeVisible();
        }).catch((err) => {
            console.error(`Error in handleAskAI for action ${action}:`, err);
            
            // Display original error message directly
            const errorMessage = typeof err === 'string' ? err : 
                               err?.message || 'Unknown error occurred';
            
            messageManager.error(errorMessage, 5);
        });
    }, [scrollToMakeVisible]);

    // Add translation result to AI data
    const addTranslationToAIData = useCallback((translatedText: string) => {
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
        // Set the last action type for translation only after we have the data
        setLastActionType(Actions.TRANSLATE);
        scrollToMakeVisible();
    }, [scrollToMakeVisible]);

    const hasAiData = aiData.length > 0;

    return {
        aiData,
        hasAiData,
        handleAskAI,
        addTranslationToAIData,
        lastActionType
    };
}; 