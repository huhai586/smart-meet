import React, { useCallback, useMemo } from 'react';
import { DatePicker } from 'antd';
import { useDateContext } from '../contexts/DateContext';
import dayjs from 'dayjs';
import './GlobalDatePicker.scss';
import useTranscripts from '../hooks/useTranscripts';

const GlobalDatePicker = () => {
    const { selectedDate, setSelectedDate } = useDateContext();
    const [, , allTranscripts] = useTranscripts();

    // 缓存日期映射
    const datesWithMessages = useMemo(() => {
        const dates = new Set();
        allTranscripts.forEach(transcript => {
            const date = dayjs(transcript.timestamp).format('YYYY-MM-DD');
            dates.add(date);
        });
        return dates;
    }, [allTranscripts]);

    const handleDateChange = (date: dayjs.Dayjs | null) => {
        setSelectedDate(date || dayjs());
    };

    const dateRender = (current: dayjs.Dayjs) => {
        const date = current.format('YYYY-MM-DD');
        const hasMessages = datesWithMessages.has(date);
        return (
            <div className="ant-picker-cell-inner">
                {current.date()}
                {hasMessages && <span className="message-dot" />}
            </div>
        );
    };

    return (
        <div className="global-date-picker">
            <DatePicker
                value={selectedDate}
                onChange={handleDateChange}
                allowClear={false}
                placeholder="Select date"
                dateRender={dateRender}
            />
        </div>
    );
};

export default GlobalDatePicker; 