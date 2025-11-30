import React, { useEffect, useState } from 'react';
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

interface CaptionButtonsVisibility {
    translate: boolean;
    polish: boolean;
    analysis: boolean;
}

const CaptionActionButtons: React.FC<CaptionActionButtonsProps> = ({
    onTranslate,
    onAskAI,
    isTranslating
}) => {
    const { t } = useI18n();
    const [buttonsVisibility, setButtonsVisibility] = useState<CaptionButtonsVisibility>({
        translate: true,
        polish: true,
        analysis: true
    });

    // 加载按钮可见性设置
    useEffect(() => {
        chrome.storage.local.get(['captionButtonsVisibility'], (result) => {
            if (result.captionButtonsVisibility) {
                setButtonsVisibility(result.captionButtonsVisibility);
            }
        });

        // 监听可见性设置变化
        const handleStorageChange = (changes: any, areaName: string) => {
            if (areaName === 'local' && changes.captionButtonsVisibility) {
                setButtonsVisibility(changes.captionButtonsVisibility.newValue);
            }
        };

        chrome.storage.onChanged.addListener(handleStorageChange);
        return () => {
            chrome.storage.onChanged.removeListener(handleStorageChange);
        };
    }, []);

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
            {buttonsVisibility.translate && (
                <Button
                    size={'small'}
                    icon={<TranslationOutlined />}
                    onClick={onTranslate}
                    loading={isTranslating}
                >
                    {getActionText(Actions.TRANSLATE)}
                </Button>
            )}

            {buttonsVisibility.polish && (
                <Button
                    size={'small'}
                    icon={<CheckCircleOutlined />}
                    onClick={() => onAskAI(Actions.POLISH)}
                >
                    {getActionText(Actions.POLISH)}
                </Button>
            )}

            {buttonsVisibility.analysis && (
                <Button
                    size={'small'}
                    icon={<CodeOutlined />}
                    onClick={() => onAskAI(Actions.ANALYSIS)}
                >
                    {getActionText(Actions.ANALYSIS)}
                </Button>
            )}
        </div>
    );
};

export default CaptionActionButtons; 