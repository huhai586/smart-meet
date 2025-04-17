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
    // 如果需要重置上下文，则清除现有会话
    if (resetContext) {
        googleAITools.clearChatSession(Actions.ASK);
    }
    
    // 检查是否已经有保存的会议内容及聊天会话
    const savedContext = googleAITools.getMeetingContext(Actions.ASK);
    
    // 如果没有保存的上下文，则获取会议内容并在askAI时传递
    if (!savedContext) {
        const recordedContents = await getMeetingCaptions();
        return askAI(Actions.ASK, JSON.stringify(recordedContents), question);
    } else {
        // 如果已有上下文，则直接使用问题询问AI
        return askAI(Actions.ASK, "", question);
    }
};

export default getAiSummary;
