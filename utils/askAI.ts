import { PROMPT, getTranslationPrompt, getSummaryPrompt } from "../constant";
import { Actions } from "../components/captions/caption";
import googleAITools from "./google-AI";
import { getCurrentLanguage } from "../hooks/useTranslationLanguage";

const askAI = async (action: Actions, text, question?: string) => {
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
    prompt = prompt + text;
    console.log('prompt', prompt);
    console.warn('send message')
    // 发送方
    const event = new CustomEvent('global-loading-event', { detail: { loading: true} });
    window.dispatchEvent(event);

    return googleAITools.askGoogleAI(prompt).catch((res) => {
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
