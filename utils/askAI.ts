import { PROMPT, getTranslationPrompt, getSummaryPrompt } from "../constant";
import { Actions } from "../components/captions/caption";
import googleAITools from "./google-AI";
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

const askAI = async (action: Actions, text, question?: string) => {
    // Check if AI is ready before proceeding
    if (!googleAITools.isAIReady()) {
        return Promise.reject('AI service not ready');
    }

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

    // 判断是否为SUMMARY模式，这种模式会保存和使用上下文
    const useContext = action === Actions.SUMMARY || action === Actions.ASK;

    // 当使用上下文模式时，不需要在每次请求中都添加完整文本
    if (!useContext) {
        prompt = prompt + text;
    }

    console.log('prompt', prompt);
    console.warn('send message')
    // 发送方
    const event = new CustomEvent('global-loading-event', { detail: { loading: true} });
    window.dispatchEvent(event);

    return googleAITools.askGoogleAI(prompt, action, useContext).catch((res) => {
        console.log('err', res);
        const event = new CustomEvent('ajax-error', { detail: { error: res} });
        window.dispatchEvent(event);
    }).finally(() => {
        // 接收方
        const event = new CustomEvent('global-loading-event', { detail: { loading: false} });
        window.dispatchEvent(event);
    });
};

export default askAI;
