import React from 'react';
import CaptionActionButtons from './CaptionActionButtons';
import { Actions } from '~components/captions/types';

interface CaptionHeaderProps {
    activeSpeaker: string;
    onTranslate: () => void;
    onAskAI: (action: Actions) => void;
    isTranslating: boolean;
}

const CaptionHeader: React.FC<CaptionHeaderProps> = ({
    activeSpeaker,
    onTranslate,
    onAskAI,
    isTranslating
}) => {
    return (
        <div className="caption-header">
            <div className={'caption-speaker'}>
                {activeSpeaker}
            </div>
            <CaptionActionButtons
                onTranslate={onTranslate}
                onAskAI={onAskAI}
                isTranslating={isTranslating}
            />
        </div>
    );
};

export default CaptionHeader; 