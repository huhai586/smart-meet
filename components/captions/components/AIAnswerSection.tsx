import React, { useState } from 'react';
import { Collapse } from 'antd';
import { InfoOutlined, TranslationOutlined, CheckCircleOutlined, CodeOutlined } from '@ant-design/icons';
import { Actions } from '~components/captions/types';
import type { AIDataItem } from '~components/captions/types';
import MarkdownRenderer from '../../summary/MarkdownRenderer';
import useI18n from '../../../utils/i18n';
import { useLanguageDetection } from '../hooks/useLanguageDetection';

interface AIAnswerSectionProps {
    aiData: AIDataItem[];
    hasAiData: boolean;
    lastActionType?: Actions; // 最后执行的操作类型
}

// Individual AI answer item component with RTL detection
const AIAnswerContent: React.FC<{ item: AIDataItem }> = ({ item }) => {
    const isRTL = useLanguageDetection(item.data);

    return (
        <div className={`ai-answer-data ${isRTL ? 'rtl' : ''}`}>
            <MarkdownRenderer content={item.data || ''} />
        </div>
    );
};

const AIAnswerSection: React.FC<AIAnswerSectionProps> = ({
    aiData,
    hasAiData,
    lastActionType
}) => {
    const { t } = useI18n();
    const [activeKey, setActiveKey] = useState<string | string[]>([]);

    // 当有新的操作类型时，自动展开对应的面板
    React.useEffect(() => {
        if (lastActionType) {
            setActiveKey([lastActionType]);
        }
    }, [lastActionType]);

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

    const getActionIcon = (action: Actions) => {
        const iconMap = {
            [Actions.TRANSLATE]: <TranslationOutlined style={{ marginRight: '8px', color: '#1a73e8' }} />,
            [Actions.POLISH]: <CheckCircleOutlined style={{ marginRight: '8px', color: '#1a73e8' }} />,
            [Actions.ANALYSIS]: <CodeOutlined style={{ marginRight: '8px', color: '#1a73e8' }} />,
            [Actions.EXPLAIN]: <InfoOutlined style={{ marginRight: '8px', color: '#1a73e8' }} />,
            [Actions.ASK]: <InfoOutlined style={{ marginRight: '8px', color: '#1a73e8' }} />,
            [Actions.DEFAULT]: <InfoOutlined style={{ marginRight: '8px', color: '#1a73e8' }} />
        };
        return iconMap[action] || <InfoOutlined style={{ marginRight: '8px', color: '#1a73e8' }} />;
    };

    if (!hasAiData) return null;

    const collapseItems = aiData.map((item) => ({
        key: item.type,
        label: (
            <span>
                {getActionIcon(item.type as Actions)}
                {getActionText(item.type as Actions)}
            </span>
        ),
        children: <AIAnswerContent item={item} />
    }));

    // Handle collapse change - only allow one panel to be open at a time
    const handleCollapseChange = (key: string | string[]) => {
        setActiveKey(key);
    };

    return (
        <div className={'ai-answer-container'}>
            <Collapse
                activeKey={activeKey}
                onChange={handleCollapseChange}
                accordion // This ensures only one panel can be open at a time
                items={collapseItems}
                size="small"
                ghost
            />
        </div>
    );
};

export default AIAnswerSection; 