import React, { useEffect, useState } from 'react';
import { Switch, Typography } from 'antd';
import { FileDoneOutlined, SketchOutlined, HistoryOutlined, EyeOutlined, TranslationOutlined, CheckCircleOutlined, CodeOutlined, ToolOutlined } from '@ant-design/icons';
import { useI18n } from '../../utils/i18n';

const { Title, Text } = Typography;

interface SidepanelVisibility {
    captions: boolean;
    summary: boolean;
    translation: boolean;
}

interface CaptionButtonsVisibility {
    translate: boolean;
    polish: boolean;
    analysis: boolean;
}

const SIDEPANEL_STORAGE_KEY = 'sidepanelVisibility';
const BUTTONS_STORAGE_KEY = 'captionButtonsVisibility';

const SidepanelSettings: React.FC = () => {
    const { t } = useI18n();
    const [visibility, setVisibility] = useState<SidepanelVisibility>({
        captions: true,
        summary: true,
        translation: true
    });

    const [buttonsVisibility, setButtonsVisibility] = useState<CaptionButtonsVisibility>({
        translate: true,
        polish: true,
        analysis: true
    });

    // 从存储中加载设置
    useEffect(() => {
        chrome.storage.local.get([SIDEPANEL_STORAGE_KEY, BUTTONS_STORAGE_KEY], (result) => {
            if (result[SIDEPANEL_STORAGE_KEY]) {
                setVisibility(result[SIDEPANEL_STORAGE_KEY]);
            }
            if (result[BUTTONS_STORAGE_KEY]) {
                setButtonsVisibility(result[BUTTONS_STORAGE_KEY]);
            }
        });
    }, []);

    // 保存标签页可见性设置到存储
    const updateVisibility = (key: keyof SidepanelVisibility, value: boolean) => {
        const newVisibility = { ...visibility, [key]: value };
        setVisibility(newVisibility);
        chrome.storage.local.set({ [SIDEPANEL_STORAGE_KEY]: newVisibility }, () => {
            console.log('Sidepanel visibility updated:', newVisibility);
        });
    };

    // 保存按钮可见性设置到存储
    const updateButtonsVisibility = (key: keyof CaptionButtonsVisibility, value: boolean) => {
        const newButtonsVisibility = { ...buttonsVisibility, [key]: value };
        setButtonsVisibility(newButtonsVisibility);
        chrome.storage.local.set({ [BUTTONS_STORAGE_KEY]: newButtonsVisibility }, () => {
            console.log('Caption buttons visibility updated:', newButtonsVisibility);
        });
    };

    return (
        <div className="extension-container">
            {/* 页面标题和描述 */}
            <div className="page-header">
                <Title level={3} style={{ marginBottom: '8px', color: '#1a202c' }}>
                    {t('sidepanel_settings')}
                </Title>
                <Text type="secondary" style={{ fontSize: '15px', display: 'block', marginBottom: '24px' }}>
                    {t('sidepanel_settings_desc')}
                </Text>
            </div>

            <div className="highlight-setting">
                {/* 标签页可见性设置 */}
                <div className="highlight-section">
                    <div className="highlight-header">
                        <EyeOutlined style={{ color: '#1a73e8' }} />
                        <span>{t('sidepanel_visibility_settings')}</span>
                    </div>
                    <div className="highlight-description">
                        {t('sidepanel_visibility_desc')}
                    </div>

                    <div className="highlight-content">
                        <div className="visibility-item">
                            <div className="visibility-info">
                                <FileDoneOutlined style={{ fontSize: '20px', color: '#1a73e8', marginRight: '12px' }} />
                                <div>
                                    <div className="visibility-label">{t('captions')}</div>
                                    <Text type="secondary" style={{ fontSize: '13px' }}>
                                        {t('captions_tab_desc')}
                                    </Text>
                                </div>
                            </div>
                            <Switch
                                checked={visibility.captions}
                                onChange={(checked) => updateVisibility('captions', checked)}
                            />
                        </div>

                        <div className="visibility-item">
                            <div className="visibility-info">
                                <SketchOutlined style={{ fontSize: '20px', color: '#1a73e8', marginRight: '12px' }} />
                                <div>
                                    <div className="visibility-label">{t('sidepanel_summary')}</div>
                                    <Text type="secondary" style={{ fontSize: '13px' }}>
                                        {t('summary_tab_desc')}
                                    </Text>
                                </div>
                            </div>
                            <Switch
                                checked={visibility.summary}
                                onChange={(checked) => updateVisibility('summary', checked)}
                            />
                        </div>

                        <div className="visibility-item">
                            <div className="visibility-info">
                                <HistoryOutlined style={{ fontSize: '20px', color: '#1a73e8', marginRight: '12px' }} />
                                <div>
                                    <div className="visibility-label">{t('translation_records')}</div>
                                    <Text type="secondary" style={{ fontSize: '13px' }}>
                                        {t('translation_tab_desc')}
                                    </Text>
                                </div>
                            </div>
                            <Switch
                                checked={visibility.translation}
                                onChange={(checked) => updateVisibility('translation', checked)}
                            />
                        </div>
                    </div>
                </div>

                {/* 字幕工具按钮可见性设置 */}
                <div className="highlight-section">
                    <div className="highlight-header">
                        <ToolOutlined style={{ color: '#1a73e8' }} />
                        <span>{t('caption_buttons_visibility_settings')}</span>
                    </div>
                    <div className="highlight-description">
                        {t('caption_buttons_visibility_desc')}
                    </div>

                    <div className="highlight-content">
                        <div className="visibility-item">
                            <div className="visibility-info">
                                <TranslationOutlined style={{ fontSize: '20px', color: '#1a73e8', marginRight: '12px' }} />
                                <div>
                                    <div className="visibility-label">{t('translate')}</div>
                                    <Text type="secondary" style={{ fontSize: '13px' }}>
                                        {t('translate_button_desc')}
                                    </Text>
                                </div>
                            </div>
                            <Switch
                                checked={buttonsVisibility.translate}
                                onChange={(checked) => updateButtonsVisibility('translate', checked)}
                            />
                        </div>

                        <div className="visibility-item">
                            <div className="visibility-info">
                                <CheckCircleOutlined style={{ fontSize: '20px', color: '#1a73e8', marginRight: '12px' }} />
                                <div>
                                    <div className="visibility-label">{t('polish')}</div>
                                    <Text type="secondary" style={{ fontSize: '13px' }}>
                                        {t('polish_button_desc')}
                                    </Text>
                                </div>
                            </div>
                            <Switch
                                checked={buttonsVisibility.polish}
                                onChange={(checked) => updateButtonsVisibility('polish', checked)}
                            />
                        </div>

                        <div className="visibility-item">
                            <div className="visibility-info">
                                <CodeOutlined style={{ fontSize: '20px', color: '#1a73e8', marginRight: '12px' }} />
                                <div>
                                    <div className="visibility-label">{t('analysis')}</div>
                                    <Text type="secondary" style={{ fontSize: '13px' }}>
                                        {t('analysis_button_desc')}
                                    </Text>
                                </div>
                            </div>
                            <Switch
                                checked={buttonsVisibility.analysis}
                                onChange={(checked) => updateButtonsVisibility('analysis', checked)}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SidepanelSettings;
