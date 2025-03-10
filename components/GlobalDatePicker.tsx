import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { DatePicker } from 'antd';
import { useDateContext } from '../contexts/DateContext';
import dayjs from 'dayjs';
import './GlobalDatePicker.scss';
import useTranscripts from '../hooks/useTranscripts';

const GlobalDatePicker = () => {
    const { selectedDate, setSelectedDate } = useDateContext();
    const [currentDayTranscripts] = useTranscripts();
    const [datesWithMessages, setDatesWithMessages] = useState(new Set<string>());


    useEffect(() => {
        console.warn('GlobalDatePicker.js', 'get-days-with-messages');
        chrome.runtime.sendMessage({
            action: 'get-days-with-messages',
        });
    }, []);

    const handleDateChange = (date: dayjs.Dayjs | null) => {
        const newDate = date || dayjs();
        setSelectedDate(newDate);
        // 通知后台更新当前日期
        chrome.runtime.sendMessage({
            action: 'set-current-date',
            date: newDate
        });
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

    useEffect(() => {
        const handleMessage = (message: any) => {
            const {action, data} = message;
            if (action === 'days-with-messages') {
                console.log('GlobalDatePicker.js', 'days-with-messages', data);
                setDatesWithMessages(new Set(data));
            }
        }
        chrome.runtime.onMessage.addListener(handleMessage);
        return () => {
            chrome.runtime.onMessage.removeListener(handleMessage);
        }
    },[])

    return (
        <div className="global-date-picker">
            <DatePicker
                value={selectedDate}
                onChange={handleDateChange}
                allowClear={false}
                placeholder="Select date"
                cellRender ={dateRender}
            />
        </div>
    );
};

export default GlobalDatePicker;
