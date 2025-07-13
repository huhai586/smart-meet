import React from 'react';
import { InfoOutlined } from '@ant-design/icons';
import { Actions } from '~components/captions/types';
import type { AIDataItem } from '~components/captions/types';
import MarkdownRenderer from '../../summary/MarkdownRenderer';
import useI18n from '../../../utils/i18n';
import { useLanguageDetection } from '../hooks/useLanguageDetection';

interface AIAnswerSectionProps {
    aiData: AIDataItem[];
    hasAiData: boolean;
}

// Individual AI answer item component with RTL detection
const AIAnswerItem: React.FC<{ item: AIDataItem; getActionText: (action: Actions) => string }> = ({
    item,
    getActionText
}) => {
    const isRTL = useLanguageDetection(item.data);

    return (
        <div key={item.type} className={'ai-answer-item'}>
            <div className={'ai-answer-type'}>
                <InfoOutlined style={{ marginRight: '8px', color: '#1a73e8' }} />
                {getActionText(item.type as Actions)}
            </div>
            <div className={`ai-answer-data ${isRTL ? 'rtl' : ''}`}>
                <MarkdownRenderer content={item.data || '' } />
            </div>
        </div>
    );
};

const AIAnswerSection: React.FC<AIAnswerSectionProps> = ({
    aiData,
    hasAiData
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

    if (!hasAiData) return null;

    return (
        <div className={'ai-answer-container'}>
            {aiData.map((item) => (
                <AIAnswerItem
                    key={item.type}
                    item={item}
                    getActionText={getActionText}
                />
            ))}
        </div>
    );
};

export default AIAnswerSection; 