import React from 'react';
import { Button } from 'antd';
import {
    TranslationOutlined,
    CheckCircleOutlined,
    CodeOutlined
} from '@ant-design/icons';
import { Actions } from '~components/captions/types';
import useI18n from '../../../utils/i18n';

interface CaptionActionButtonsProps {
    onTranslate: () => void;
    onAskAI: (action: Actions) => void;
    isTranslating: boolean;
}

const CaptionActionButtons: React.FC<CaptionActionButtonsProps> = ({
    onTranslate,
    onAskAI,
    isTranslating
}) => {
    const { t } = useI18n();

    const getActionText = (action: Actions): string => {
        const actionMap = {
            [Actions.TRANSLATE]: t('translate'),
            [Actions.EXPLAIN]: t('explain'),
            [Actions.POLISH]: t('polish'),
            [Actions.ANALYSIS]: t('analysis'),
            [Actions.ASK]: t('ask'),
            [Actions.DEFAULT]: ''
        };
        return actionMap[action] || action;
    };

    return (
        <div className="caption-tools">
            <Button
                size={'small'}
                icon={<TranslationOutlined />}
                onClick={onTranslate}
                loading={isTranslating}
            >
                {getActionText(Actions.TRANSLATE)}
            </Button>

            <Button
                size={'small'}
                icon={<CheckCircleOutlined />}
                onClick={() => onAskAI(Actions.POLISH)}
            >
                {getActionText(Actions.POLISH)}
            </Button>

            <Button
                size={'small'}
                icon={<CodeOutlined />}
                onClick={() => onAskAI(Actions.ANALYSIS)}
            >
                {getActionText(Actions.ANALYSIS)}
            </Button>
        </div>
    );
};

export default CaptionActionButtons; 