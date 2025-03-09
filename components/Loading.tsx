import React from 'react';
import './Loading.scss';

interface LoadingProps {
    spinning: boolean;
}

const Loading: React.FC<LoadingProps> = ({ spinning }) => {
    if (!spinning) return null;
    
    return (
        <div className="flowing-loading-bar">
            <div className="loading-gradient"></div>
        </div>
    );
};

export default Loading; 