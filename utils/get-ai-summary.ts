import { Actions } from "~components/captions/types"
import askAI from "./askAI"

/**
 * 获取AI对会议内容的总结或回答特定问题
 * @param question 要问的问题
 * @returns {Promise<string>} AI的回答
 */
const getAiSummary = async (question: string) => {
    // 直接使用问题询问AI，AI会自动获取最新的会议记录
    return askAI(Actions.ASK, "", question);
};

export default getAiSummary;
