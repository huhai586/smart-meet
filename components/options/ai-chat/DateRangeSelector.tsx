import React, { useState, useEffect, useRef, useMemo } from 'react';
import { DatePicker, Select } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import useI18n from '~/utils/i18n';

const { RangePicker } = DatePicker;

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
  const { t } = useI18n();
  const [preset, setPreset] = useState('3d');
  const [range, setRange] = useState<[Dayjs, Dayjs]>(() => computeRange('3d'));

  const presets = useMemo(() => [
    { label: t('preset_3d'), value: '3d' },
    { label: t('preset_7d'), value: '7d' },
    { label: t('preset_14d'), value: '14d' },
    { label: t('preset_1m'), value: '1m' },
    { label: t('preset_2m'), value: '2m' },
    { label: t('preset_3m'), value: '3m' },
    { label: t('preset_custom'), value: 'custom' },
  ], [t]);

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
        <span className="ai-chat__range-label">{t('select_date_range')}</span>
        <Select
          value={preset}
          onChange={handlePresetChange}
          disabled={loading}
          options={presets}
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
          format={t('date_format_short')}
          allowClear={false}
          style={{ width: '100%' }}
        />
      </div>
    </div>
  );
};

export default DateRangeSelector;
