import React, { createContext, useContext, useState } from 'react';
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
    const [selectedDate, setSelectedDate] = useState(dayjs());

    return (
        <DateContext.Provider value={{ selectedDate, setSelectedDate }}>
            {children}
        </DateContext.Provider>
    );
};

export const useDateContext = () => useContext(DateContext); 