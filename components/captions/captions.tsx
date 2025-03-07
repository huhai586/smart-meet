import {Button, Empty, FloatButton, DatePicker} from "antd";
import React, {useEffect, useMemo, useRef, useState} from "react";
import useTranscripts from "../../hooks/useTranscripts";
import CaptionList from "./captionList";
import './captions.scss';
import useAutoScroll from "../../hooks/useScroll";
import dayjs from 'dayjs';

const Captions = (props) => {
    const chatContainer = useRef(null);
    const [speakers, setSpeakers] = useState([]);
    const [filterSpeaker, setFilterSpeakers] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);
    const [transcripts] = useTranscripts();

    useEffect(() => {
        const speakers = [...new Set(transcripts.map((item) => item.activeSpeaker))] ;
        setSpeakers(speakers);
    }, [transcripts]);

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

    const getTranscripts = () => {
        let filtered = transcripts;

        // 日期筛选
        if (selectedDate) {
            filtered = filtered.filter(transcript => {
                const transcriptDate = dayjs(transcript.timestamp);
                return transcriptDate.isSame(selectedDate, 'day');
            });
        }

        // 发言人筛选
        if (filterSpeaker.length > 0) {
            filtered = filtered.filter((v) => filterSpeaker.includes(v.activeSpeaker));
        }

        return filtered;
    }

    const toggleSpeaker = (speaker: string) => {
        if (filterSpeaker.includes(speaker)) {
            setFilterSpeakers(filterSpeaker.filter((v) => v !== speaker));
        } else {
            setFilterSpeakers([...filterSpeaker, speaker]);
        }
    }

    // 获取有聊天记录的日期
    const getDatesWithMessages = () => {
        const dates = new Set();
        transcripts.forEach(transcript => {
            const date = dayjs(transcript.timestamp).format('YYYY-MM-DD');
            dates.add(date);
        });
        return Array.from(dates);
    }

    const data = useMemo(() => {
        return getTranscripts();
    }, [transcripts, filterSpeaker, selectedDate]);

    const isNoData = data.length === 0;

    useAutoScroll(chatContainer, data);

    return (
        <div className={`captions`}>
            <div className="filter-section">
                <DatePicker
                    onChange={handleDateChange}
                    value={selectedDate}
                    allowClear
                    placeholder="Select date"
                    dateRender={(current) => {
                        const date = current.format('YYYY-MM-DD');
                        const hasMessages = getDatesWithMessages().includes(date);
                        return (
                            <div className="ant-picker-cell-inner">
                                {current.date()}
                                {hasMessages && <span className="message-dot" />}
                            </div>
                        );
                    }}
                    style={{ marginBottom: '10px' }}
                />
                <div className="filter-speakers">
                    {speakers.length > 0 && "Filter:"}
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

            <div className={`chat-container ${isNoData ? 'no-data' : ''}`} ref={chatContainer}>
                {data.length > 0 ? (
                    <CaptionList listData={data}/>
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
