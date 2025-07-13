import React from 'react';
import useI18n from '../../../utils/i18n';

interface AutoTranslationSectionProps {
    autoTranslatedContent: string;
    isRTL: boolean | null;
}

const AutoTranslationSection: React.FC<AutoTranslationSectionProps> = ({
    autoTranslatedContent,
    isRTL
}) => {
    const { t } = useI18n();

    if (!autoTranslatedContent) return null;

    return (
        <div className={'auto-translation-container'}>
            <div className={'auto-translation-label'}>
                {t('auto_translated')}
            </div>
            <div 
                className={`auto-translation-content ${isRTL ? 'rtl' : ''}`} 
                dangerouslySetInnerHTML={{__html: autoTranslatedContent}}
            />
        </div>
    );
};

export default AutoTranslationSection; 