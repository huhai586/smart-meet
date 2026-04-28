import React, { useState, useEffect, useRef } from 'react';
import { DatePicker, Select } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;

const PRESETS = [
  { label: '最近3天', value: '3d' },
  { label: '最近一周', value: '7d' },
  { label: '最近2周', value: '14d' },
  { label: '最近1个月', value: '1m' },
  { label: '最近2个月', value: '2m' },
  { label: '最近3个月', value: '3m' },
  { label: '自定义区间', value: 'custom' },
];

function computeRange(preset: string): [Dayjs, Dayjs] {
  const today = dayjs();
  switch (preset) {
    case '3d':  return [today.subtract(2, 'day').startOf('day'), today.endOf('day')];
    case '7d':  return [today.subtract(6, 'day').startOf('day'), today.endOf('day')];
    case '14d': return [today.subtract(13, 'day').startOf('day'), today.endOf('day')];
    case '1m':  return [today.subtract(1, 'month').add(1, 'day').startOf('day'), today.endOf('day')];
    case '2m':  return [today.subtract(2, 'month').add(1, 'day').startOf('day'), today.endOf('day')];
    case '3m':  return [today.subtract(3, 'month').add(1, 'day').startOf('day'), today.endOf('day')];
    default:    return [today.startOf('day'), today.endOf('day')];
  }
}

interface Props {
  value: [Dayjs, Dayjs] | null;
  onChange: (range: [Dayjs, Dayjs] | null) => void;
  loading?: boolean;
}

const DateRangeSelector: React.FC<Props> = ({ onChange, loading }) => {
  const [preset, setPreset] = useState('3d');
  const [range, setRange] = useState<[Dayjs, Dayjs]>(() => computeRange('3d'));

  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; });

  // Emit range whenever it changes
  useEffect(() => {
    onChangeRef.current(range);
  }, [range]);

  const handlePresetChange = (value: string) => {
    setPreset(value);
    if (value !== 'custom') {
      setRange(computeRange(value));
    }
  };

  const handleRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      setPreset('custom');
      setRange([dates[0].startOf('day'), dates[1].endOf('day')]);
    }
  };

  return (
    <div className="ai-chat__range-section">
      <div className="ai-chat__range-header">
        <span className="ai-chat__range-label">选择会议日期范围</span>
        <Select
          value={preset}
          onChange={handlePresetChange}
          disabled={loading}
          options={PRESETS}
          size="small"
          variant="borderless"
          style={{ minWidth: 100 }}
          popupMatchSelectWidth={false}
          className="ai-chat__range-preset"
        />
      </div>
      <div className="ai-chat__range-picker-wrap">
        <RangePicker
          value={range}
          onChange={handleRangeChange}
          disabled={loading}
          disabledDate={(d) => d.isAfter(dayjs())}
          format="M月D日"
          allowClear={false}
          style={{ width: '100%' }}
        />
      </div>
    </div>
  );
};

export default DateRangeSelector;
