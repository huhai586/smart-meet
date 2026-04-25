import React from 'react';

interface CaptionTimestampProps {
    timestamp: number;
}

const CaptionTimestamp: React.FC<CaptionTimestampProps> = ({ timestamp }) => {
    return (
        <div className="timestamp">
            {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
    );
};

export default CaptionTimestamp; 