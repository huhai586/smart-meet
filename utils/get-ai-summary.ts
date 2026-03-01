import { Actions } from "~components/captions/types"
import askAI from "./askAI"
import type { Dayjs } from 'dayjs'

/**
 * 获取AI对会议内容的总结或回答特定问题
 * @param question 要问的问题
 * @param date 指定日期，用于获取该日期的会议记录
 * @returns {Promise<string>} AI的回答
 */
const getAiSummary = async (question: string, date: Dayjs) => {
    // 直接使用问题询问AI，传递日期确保获取正确的会议记录
    return askAI(Actions.ASK, "", question, date);
};

export default getAiSummary;
