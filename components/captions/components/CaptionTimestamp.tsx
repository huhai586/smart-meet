import React from 'react';
import { ClockCircleOutlined } from '@ant-design/icons';

interface CaptionTimestampProps {
    timestamp: number;
}

const CaptionTimestamp: React.FC<CaptionTimestampProps> = ({ timestamp }) => {
    return (
        <div className="timestamp">
            <ClockCircleOutlined style={{ marginRight: '6px', fontSize: '12px' }} />
            {new Date(timestamp).toLocaleString()}
        </div>
    );
};

export default CaptionTimestamp; 