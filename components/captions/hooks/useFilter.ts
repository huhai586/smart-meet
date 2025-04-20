import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Dayjs } from 'dayjs';
import { formatDate, createLookupMap, useTranscriptFilter } from '../filterUtils';
import type { Transcript } from '../../../hooks/useTranscripts';

/**
 * 处理字幕过滤的自定义Hook
 */
export const useFilter = (transcripts: Transcript[], selectedDate?: Dayjs) => {
  const [speakers, setSpeakers] = useState<string[]>([]);
  const [filterSpeaker, setFilterSpeakers] = useState<string[]>([]);
  const [meetingNames, setMeetingNames] = useState<string[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState('');

  // 优化：使用useCallback包装toggleSpeaker和toggleMeeting函数
  const toggleSpeaker = useCallback((speaker: string) => {
    setFilterSpeakers(prev => {
      if (prev.includes(speaker)) {
        return prev.filter(s => s !== speaker);
      } else {
        return [...prev, speaker];
      }
    });
  }, []);

  const toggleMeeting = useCallback((meetingName: string) => {
    setSelectedMeeting(prev => prev === meetingName ? '' : meetingName);
  }, []);

  // 缓存日期映射
  const datesWithMessages = useMemo(() => {
    const dates = new Set<string>();
    transcripts.forEach(transcript => {
      const date = formatDate(transcript.timestamp);
      dates.add(date);
    });
    return dates;
  }, [transcripts]);

  // 根据选中日期获取发言人列表 - 优化使用 for 循环和 Set
  const availableSpeakers = useMemo(() => {
    const speakerSet = new Set<string>();
    const len = transcripts.length;

    if (selectedDate) {
      const targetDate = selectedDate.format('YYYY-MM-DD');

      for (let i = 0; i < len; i++) {
        const transcript = transcripts[i];
        const transcriptDate = formatDate(transcript.timestamp);

        if (transcriptDate === targetDate) {
          speakerSet.add(transcript.activeSpeaker);
        }
      }
    } else {
      for (let i = 0; i < len; i++) {
        speakerSet.add(transcripts[i].activeSpeaker);
      }
    }

    return Array.from(speakerSet);
  }, [transcripts, selectedDate]);

  // 根据选中日期获取会议名称列表 - 优化使用 for 循环和 Set
  const availableMeetingNames = useMemo(() => {
    const meetingSet = new Set<string>();
    const len = transcripts.length;

    if (selectedDate) {
      const targetDate = selectedDate.format('YYYY-MM-DD');

      for (let i = 0; i < len; i++) {
        const transcript = transcripts[i];
        const transcriptDate = formatDate(transcript.timestamp);

        if (transcriptDate === targetDate && transcript.meetingName) {
          meetingSet.add(transcript.meetingName);
        }
      }
    } else {
      for (let i = 0; i < len; i++) {
        const meetingName = transcripts[i].meetingName;
        if (meetingName) {
          meetingSet.add(meetingName);
        }
      }
    }

    return Array.from(meetingSet);
  }, [transcripts, selectedDate]);

  // 更新发言人列表和过滤器
  useEffect(() => {
    setSpeakers(availableSpeakers);
    // 移除不在当前日期的发言人 - 使用查找映射优化
    if (availableSpeakers.length > 0) {
      const speakerLookup = createLookupMap<string>(availableSpeakers);
      setFilterSpeakers(prev => prev.filter(speaker => speakerLookup[speaker]));
    } else {
      setFilterSpeakers([]);
    }
  }, [availableSpeakers]);

  // 更新会议名称列表
  useEffect(() => {
    setMeetingNames(availableMeetingNames);
    // 如果当前选中的会议不在列表中，清除选择
    if (selectedMeeting && !availableMeetingNames.includes(selectedMeeting)) {
      setSelectedMeeting('');
    }
  }, [availableMeetingNames, selectedMeeting]);

  // 使用优化的筛选Hook替换原有的三个级联useMemo
  const filteredData = useTranscriptFilter(
    transcripts,
    selectedDate,
    filterSpeaker,
    selectedMeeting
  );

  return {
    speakers,
    filterSpeaker,
    meetingNames,
    selectedMeeting,
    filteredData,
    toggleSpeaker,
    toggleMeeting,
    datesWithMessages
  };
}; 