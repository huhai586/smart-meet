import { PROMPT} from "../constant";
import {Actions} from "../components/captions/caption";
import googleAITools from "./google-AI";


const askAI = (action: Actions, text, question?: string) => {
    const actionMap = {
        [Actions.TRANSLATE]: PROMPT.TRANSLATE,
        [Actions.POLISH]: PROMPT.POLISH,
        [Actions.ANALYSIS]: PROMPT.ANALYSIS,
        [Actions.ASK]: PROMPT.ASK,
        [Actions.EXPLAIN]: PROMPT.EXPLAIN,
        [Actions.DEFAULT]: PROMPT.DEFAULT,
        [Actions.SUMMARY]: PROMPT.SUMMARY
    }
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
