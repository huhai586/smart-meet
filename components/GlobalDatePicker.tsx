import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { DatePicker, Button, Popover } from 'antd';
import { CalendarOutlined, EditOutlined } from '@ant-design/icons';
import { useDateContext } from '../contexts/DateContext';
import dayjs from 'dayjs';
import './GlobalDatePicker.scss';
import useTranscripts from '../hooks/useTranscripts';

const GlobalDatePicker = () => {
    const { selectedDate, setSelectedDate } = useDateContext();
    const [currentDayTranscripts] = useTranscripts();
    const [datesWithMessages, setDatesWithMessages] = useState(new Set<string>());
    const [open, setOpen] = useState(false);

    useEffect(() => {
        console.warn('GlobalDatePicker.js', 'get-days-with-messages');
        chrome.runtime.sendMessage({
            action: 'get-days-with-messages',
        });
    }, []);

    const handleDateChange = (date: dayjs.Dayjs | null) => {
        const newDate = date || dayjs();
        setSelectedDate(newDate);
        setOpen(false); // Close the popover after selection
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

    // Format display text: MM/DD format
    const displayText = useMemo(() => {
        return selectedDate.format('MM/DD');
    }, [selectedDate]);

    return (
        <div className="global-date-picker-compact">
            <Button 
                type="text" 
                className="date-display-button"
                icon={<CalendarOutlined />}
                onClick={() => setOpen(true)}
            >
                <span className="date-text">{displayText}</span>
            </Button>
            <DatePicker
                value={selectedDate}
                onChange={handleDateChange}
                allowClear={false}
                placeholder="Select date"
                cellRender={dateRender}
                open={open}
                onOpenChange={setOpen}
                dropdownClassName="global-date-picker-dropdown"
                style={{ 
                    position: 'absolute',
                    visibility: 'hidden',
                    pointerEvents: 'none',
                    width: 0,
                    height: 0
                }}
            />
        </div>
    );
};

export default GlobalDatePicker;
