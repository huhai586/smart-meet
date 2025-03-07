import {Button, Empty, FloatButton, DatePicker, Typography} from "antd";
import React, {useEffect, useMemo, useRef, useState, useCallback} from "react";
import useTranscripts from "../../hooks/useTranscripts";
import CaptionList from "./captionList";
import './captions.scss';
import useAutoScroll from "../../hooks/useScroll";
import dayjs from 'dayjs';

const { Title } = Typography;

const Captions = (props) => {
    const chatContainer = useRef(null);
    const [speakers, setSpeakers] = useState([]);
    const [filterSpeaker, setFilterSpeakers] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);
    const [transcripts] = useTranscripts();

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

    // 添加跳转到指定日期的方法
    const jumpToDate = (date?: dayjs.Dayjs) => {
        setSelectedDate(date);
        if (chatContainer.current) {
            chatContainer.current.scrollTop = 0;
        }
    }

    // 将原来的 handleDateChange 修改为使用 jumpToDate
    const handleDateChange = (date) => {
        jumpToDate(date);
    }

    // 暴露 jumpToDate 方法给父组件
    useEffect(() => {
        if (props.onRef) {
            props.onRef({
                jumpToDate
            });
        }
    }, []);

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

    // 优化 dateRender 性能
    const dateRender = useCallback((current) => {
        const date = current.format('YYYY-MM-DD');
        const hasMessages = datesWithMessages.has(date);
        return (
            <div className="ant-picker-cell-inner">
                {current.date()}
                {hasMessages && <span className="message-dot" />}
            </div>
        );
    }, [datesWithMessages]);

    const toggleSpeaker = (speaker: string) => {
        if (filterSpeaker.includes(speaker)) {
            setFilterSpeakers(filterSpeaker.filter((v) => v !== speaker));
        } else {
            setFilterSpeakers([...filterSpeaker, speaker]);
        }
    }

    return (
        <div className={`captions`}>
            <div className="filter-section">
                <div className="date-filter">
                    <Title level={5} style={{ margin: '0', lineHeight: '32px' }}>Filter by date:</Title>
                    <DatePicker
                        onChange={handleDateChange}
                        value={selectedDate}
                        allowClear
                        placeholder="Select date"
                        dateRender={dateRender}
                    />
                </div>
                {speakers.length > 0 && (
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
                )}

            </div>

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
