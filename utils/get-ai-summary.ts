import { Actions } from "../components/captions/caption"
import askAI from "./askAI"
import getMeetingCaptions from './getCaptions';
import googleAITools from "./google-AI";

/**
 * 获取AI对会议内容的总结或回答特定问题
 * @param question 要问的问题
 * @param resetContext 是否重置上下文，默认为false
 * @returns {Promise<string>} AI的回答
 */
const getAiSummary = async (question: string, resetContext: boolean = false) => {
    // 如果需要重置上下文，则清除现有对话
    if (resetContext) {
        googleAITools.clearConversation(Actions.ASK);
    }
    
    // 直接使用问题询问AI，AI会自动获取最新的会议记录
    return askAI(Actions.ASK, "", question);
};

export default getAiSummary;
