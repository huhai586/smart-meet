import { PROMPT, getTranslationPrompt, getSummaryPrompt } from "../constant";
import { Actions } from "../components/captions/caption";
import aiServiceManager from "./ai";
import { getCurrentLanguage } from "../hooks/useTranslationLanguage";

// Debounce function to prevent multiple error notifications
let errorNotificationTimeout: NodeJS.Timeout | null = null;
const showErrorNotification = (message: string) => {
    if (errorNotificationTimeout) {
        clearTimeout(errorNotificationTimeout);
    }
    errorNotificationTimeout = setTimeout(() => {
        const event = new CustomEvent('ajax-error', {
            detail: { error: { message } }
        });
        window.dispatchEvent(event);
        errorNotificationTimeout = null;
    }, 2000); // Only show error notification every 2 seconds
};

const askAI = async (action: Actions, text: string, question?: string) => {
    // 获取当前AI服务实例
    const aiService = aiServiceManager.getCurrentService();
    
    // 检查AI服务是否准备就绪
    if (!aiService || !aiService.isReady()) {
        // 输出日志以便调试
        console.error(`[askAI] AI service not ready. Current service type: ${aiServiceManager.getCurrentServiceType()}`);
        console.error(`[askAI] Initialized services: ${aiServiceManager.getInitializedServices().join(', ')}`);
        
        return Promise.reject('AI service not ready');
    }

    // 输出当前使用的服务类型
    console.log(`[askAI] Using service: ${aiServiceManager.getCurrentServiceType()}`);

    // 获取当前选择的翻译语言
    const currentLanguage = await getCurrentLanguage();

    // 根据当前语言更新翻译和摘要提示
    const actionMap = {
        [Actions.TRANSLATE]: getTranslationPrompt(currentLanguage.code),
        [Actions.POLISH]: PROMPT.POLISH,
        [Actions.ANALYSIS]: PROMPT.ANALYSIS,
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
