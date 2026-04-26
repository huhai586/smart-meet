import React from 'react';
import { DatePicker } from 'antd';
import type { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;

interface Props {
  value: [Dayjs, Dayjs] | null;
  onChange: (range: [Dayjs, Dayjs] | null) => void;
  loading?: boolean;
}

const DateRangeSelector: React.FC<Props> = ({ value, onChange, loading }) => {
  return (
    <div className="ai-chat__range-section">
      <div className="ai-chat__range-label">选择会议日期范围</div>
      <div className="ai-chat__range-picker-wrap">
        <RangePicker
          value={value}
          onChange={(dates) => {
            if (!dates || !dates[0] || !dates[1]) {
              onChange(null);
            } else {
              onChange([dates[0], dates[1]]);
            }
          }}
          disabled={loading}
          disabledDate={d => d.isAfter(new Date())}
          style={{ width: '100%' }}
          placeholder={['开始日期', '结束日期']}
          format="M月D日"
          allowClear
        />
      </div>
    </div>
  );
};

export default DateRangeSelector;
