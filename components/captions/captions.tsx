import {Button, Empty, FloatButton, Typography} from "antd";
import React, {useEffect, useMemo, useRef, useState, useCallback} from "react";
import useTranscripts from "../../hooks/useTranscripts";
import CaptionList from "./captionList";
import './captions.scss';
import useAutoScroll from "../../hooks/useScroll";
import dayjs from 'dayjs';
import { useDateContext } from '../../contexts/DateContext';

const { Title } = Typography;

const Captions = (props) => {
    const chatContainer = useRef(null);
    const [speakers, setSpeakers] = useState([]);
    const [filterSpeaker, setFilterSpeakers] = useState([]);
    const [transcripts] = useTranscripts();
    const { selectedDate, setSelectedDate } = useDateContext();

    // 缓存日期映射
    const datesWithMessages = useMemo(() => {
        const dates = new Set();
        transcripts.forEach(transcript => {
            const date = dayjs(transcript.timestamp).format('YYYY-MM-DD');
            dates.add(date);
        });
        return dates;
    }, [transcripts]);

    // 根据选中日期获取发言人列表
    const availableSpeakers = useMemo(() => {
        let filtered = transcripts;
        if (selectedDate) {
            const targetDate = selectedDate.format('YYYY-MM-DD');
            filtered = filtered.filter(transcript => {
                const transcriptDate = dayjs(transcript.timestamp).format('YYYY-MM-DD');
                return transcriptDate === targetDate;
            });
        }
        return [...new Set(filtered.map(item => item.activeSpeaker))];
    }, [transcripts, selectedDate]);

    // 更新发言人列表和过滤器
    useEffect(() => {
        setSpeakers(availableSpeakers);
        // 移除不在当前日期的发言人
        setFilterSpeakers(prev => prev.filter(speaker => availableSpeakers.includes(speaker)));
    }, [availableSpeakers]);


    // 优化过滤操作
    const filteredData = useMemo(() => {
        let filtered = transcripts;

        // 使用 Map 优化发言人过滤
        if (filterSpeaker.length > 0) {
            const speakerSet = new Set(filterSpeaker);
            filtered = filtered.filter(v => speakerSet.has(v.activeSpeaker));
        }

        // 日期筛选
        if (selectedDate) {
            const targetDate = selectedDate.format('YYYY-MM-DD');
            filtered = filtered.filter(transcript => {
                const transcriptDate = dayjs(transcript.timestamp).format('YYYY-MM-DD');
                return transcriptDate === targetDate;
            });
        }

        return filtered;
    }, [transcripts, filterSpeaker, selectedDate]);

    const isNoData = filteredData.length === 0;

    useAutoScroll(chatContainer, filteredData);

    const toggleSpeaker = (speaker: string) => {
        if (filterSpeaker.includes(speaker)) {
            setFilterSpeakers(filterSpeaker.filter((v) => v !== speaker));
        } else {
            setFilterSpeakers([...filterSpeaker, speaker]);
        }
    }

    return (
        <div className={`captions`}>
            {speakers.length > 0 && (
                <div className="filter-section">
                    <div className="filter-speakers">
                        <Title level={5} style={{ margin: '0', lineHeight: '32px' }}>Filter by talker:</Title>
                        {speakers.map((speaker) => (
                            <Button
                                color="default"
                                variant={filterSpeaker.includes(speaker) ? 'solid' : 'outlined'}
                                size={'small'}
                                onClick={() => {toggleSpeaker(speaker)}}
                                key={speaker}
                            >
                                {speaker}
                            </Button>
                        ))}
                    </div>
            </div>
            )}

            <div className={`chat-container ${isNoData ? 'no-data' : ''}`} ref={chatContainer}>
                {filteredData.length > 0 ? (
                    <CaptionList listData={filteredData}/>
                ) : (
                    <Empty description={
                        selectedDate
                            ? `No messages on ${selectedDate.format('YYYY-MM-DD')}`
                            : "No messages"
                    }/>
                )}
            </div>
            <FloatButton.BackTop visibilityHeight={100} target={ () => document.querySelector('.chat-container') as HTMLElement}/>
        </div>
    )
}

export default Captions;
