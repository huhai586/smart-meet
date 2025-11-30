import { PROMPT, getTranslationPrompt, getSummaryPrompt, getPolishPrompt, getAnalysisPrompt } from "../constant";
import { Actions } from "~components/captions/types";
import aiServiceManager from "./ai";
import { getCurrentLanguage } from "../hooks/useTranslationLanguage";
import { getCurrentUILanguage } from "../hooks/useUILanguage";
import { detectLanguage } from "./language-detector";
import { handleAIError } from "./ai-error-handler";


const askAI = async (action: Actions, text: string, question?: string) => {
    // 获取当前AI服务实例
    const aiService = aiServiceManager.getCurrentService();
    
    // 检查AI服务是否准备就绪
    if (!aiService || !aiService.isReady()) {
        // 输出详细日志以便调试
        console.error(`[askAI] AI service not ready!`);
        console.error(`[askAI] Current service type: ${aiServiceManager.getCurrentServiceType()}`);
        console.error(`[askAI] Initialized services: ${aiServiceManager.getInitializedServices().join(', ') || 'none'}`);
        console.error(`[askAI] Service instance exists: ${!!aiService}`);
        if (aiService) {
            console.error(`[askAI] Service isReady(): ${aiService.isReady()}`);
        }
        
        const error = 'AI service not ready';
        // 使用全局错误处理器处理
        handleAIError(error);
        return Promise.reject(error);
    }

    // 输出当前使用的服务类型
    console.log(`[askAI] Using service: ${aiServiceManager.getCurrentServiceType()}`);

    // 获取当前选择的翻译语言和UI语言
    const currentLanguage = await getCurrentLanguage();
    const currentUILanguage = await getCurrentUILanguage();
    
    // 检测文本语言（用于POLISH和ANALYSIS）
    const detectedLanguage = detectLanguage(text);
    
    // 输出语言检测结果（仅在POLISH和ANALYSIS时）
    if (action === Actions.POLISH || action === Actions.ANALYSIS) {
        console.log(`[askAI] Detected language: ${detectedLanguage}, Translation language: ${currentLanguage.code}, UI language: ${currentUILanguage.code}, Action: ${action}`);
    }
    
    // 根据当前语言更新翻译和摘要提示
    const actionMap = {
        [Actions.TRANSLATE]: getTranslationPrompt(currentLanguage.code),
        [Actions.POLISH]: getPolishPrompt(detectedLanguage),
        [Actions.ANALYSIS]: getAnalysisPrompt(detectedLanguage, currentLanguage.code), // 使用翻译语言而不是UI语言
        [Actions.ASK]: PROMPT.ASK,
        [Actions.EXPLAIN]: PROMPT.EXPLAIN,
        [Actions.DEFAULT]: PROMPT.DEFAULT,
        [Actions.SUMMARY]: getSummaryPrompt(currentLanguage.code)
    };

    let prompt = `${actionMap[action]}`;
    if (question) {
        prompt = prompt.replace('{option}', question);
    }

    // 判断是否为SUMMARY或ASK模式，这些模式会保存和使用上下文
    const useContext = action === Actions.ASK || action === Actions.SUMMARY; 
    prompt = useContext ? prompt : (prompt + text);

    console.log(`[askAI] Action: ${action}, Use context: ${useContext}`);
    console.warn('send message');
    
    // 发送加载事件
    const loadingEvent = new CustomEvent('global-loading-event', { detail: { loading: true} });
    window.dispatchEvent(loadingEvent);

    try {
        // 使用AI服务生成响应
        const response = await aiServiceManager.generateResponse(prompt, action, useContext);
        return response;
    } catch (error) {
        console.log('[askAI] Error:', error);
        const errorEvent = new CustomEvent('ajax-error', { detail: { error } });
        window.dispatchEvent(errorEvent);
        throw error;
    } finally {
        // 发送完成加载事件
        const finishEvent = new CustomEvent('global-loading-event', { detail: { loading: false} });
        window.dispatchEvent(finishEvent);
    }
};

export default askAI;
