import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import dayjs from 'dayjs';

interface DateContextType {
    selectedDate: dayjs.Dayjs;
    setSelectedDate: (date: dayjs.Dayjs | null) => void;
}

const DateContext = createContext<DateContextType>({
    selectedDate: dayjs(),
    setSelectedDate: () => {},
});

export const DateProvider = ({ children }) => {
    const [selectedDate, setSelectedDateState] = useState(dayjs());

    const setSelectedDate = useCallback((date: dayjs.Dayjs | null) => {
        console.log('DateContext: Setting new date:', date?.format('YYYY-MM-DD'));
        setSelectedDateState(date || dayjs());
    }, []);

    useEffect(() => {
        const handleMessage = (message) => {
            console.log('DateContext received message:', message);
            if (message.action === 'jump-to-date' && message.date) {
                const newDate = dayjs(Number(message.date));
                console.log('DateContext setting new date:', newDate.format('YYYY-MM-DD'));
                setSelectedDate(newDate);
            }
        };

        console.log('DateContext: Adding message listener');
        chrome.runtime.onMessage.addListener(handleMessage);
        return () => {
            console.log('DateContext: Removing message listener');
            chrome.runtime.onMessage.removeListener(handleMessage);
        };
    }, [setSelectedDate]);

    return (
        <DateContext.Provider value={{ selectedDate, setSelectedDate }}>
            {children}
        </DateContext.Provider>
    );
};

export const useDateContext = () => useContext(DateContext); 