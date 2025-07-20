import { useMemo } from 'react';
import dayjs from 'dayjs';

interface Transcript {
    timestamp: number | string;
    activeSpeaker: string;
    meetingName: string;
}

/**
 * 创建一个记忆化的查找映射，用于快速检查值是否存在
 * @param values 值数组
 * @returns 查找映射对象
 */
export const createLookupMap = <T extends string | number>(values: T[]): Record<T, boolean> => {
  const map: Record<T, boolean> = {} as Record<T, boolean>;
  for (let i = 0; i < values.length; i++) {
    map[values[i]] = true;
  }
  return map;
};

/**
 * 根据日期格式化时间戳
 * @param timestamp 时间戳
 * @param format 日期格式
 * @returns 格式化后的日期字符串
 */
export const formatDate = (timestamp: number | string, format = 'YYYY-MM-DD'): string => {
  return dayjs(timestamp).format(format);
};

/**
 * 自定义Hook: 高效筛选转录数据
 * @param transcripts 原始转录数据
 * @param selectedDate 选中的日期
 * @param filterSpeakers 筛选的发言人
 * @param selectedMeeting 选中的会议
 * @returns 筛选后的数据
 */
export const useTranscriptFilter = (
  transcripts: Transcript[],
  selectedDate: dayjs.Dayjs | null,
  filterSpeakers: string[],
  selectedMeeting: string
) => {
  // 创建发言人查找映射
  const speakerLookup = useMemo(() => {
    return filterSpeakers.length > 0 ? createLookupMap(filterSpeakers) : null;
  }, [filterSpeakers]);

  // 日期格式化
  const targetDate = useMemo(() => {
    return selectedDate ? selectedDate.format('YYYY-MM-DD') : null;
  }, [selectedDate]);

  // 一次性筛选所有条件
  return useMemo(() => {
    // 如果没有任何筛选条件，直接返回原始数据
    if (!targetDate && !speakerLookup && !selectedMeeting) {
      return transcripts;
    }

    // 使用 for 循环代替 filter 方法，减少函数调用和数组创建
    const result = [];
    const len = transcripts.length;
    
    for (let i = 0; i < len; i++) {
      const transcript = transcripts[i];
      
      // 日期筛选
      if (targetDate) {
        const transcriptDate = formatDate(transcript.timestamp);
        if (transcriptDate !== targetDate) continue;
      }
      
      // 发言人筛选
      if (speakerLookup && !speakerLookup[transcript.activeSpeaker]) {
        continue;
      }
      
      // 会议名称筛选
      if (selectedMeeting && transcript.meetingName !== selectedMeeting) {
        continue;
      }
      
      // 通过所有筛选条件，添加到结果
      result.push(transcript);
    }
    
    return result;
  }, [transcripts, targetDate, speakerLookup, selectedMeeting]);
}; 