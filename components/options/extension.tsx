import { PlusOutlined, TagOutlined, FileTextOutlined, QuestionCircleOutlined, CalendarOutlined, FontSizeOutlined, MinusOutlined, EditOutlined, DeleteOutlined, RobotOutlined } from "@ant-design/icons"
import { Button, Input, Tag, type InputRef, Modal, Typography, Divider, Select, DatePicker, List, Space } from "antd"
import { TweenOneGroup } from "rc-tween-one"
import { useEffect, useRef, useState } from "react"
import dayjs, { type Dayjs } from 'dayjs';

import { getSpecificTags } from "../../utils/common";
import { useI18n } from '../../utils/i18n';
import getMeetingCaptions from '../../utils/getCaptions';
import saveChatLogAsTxt from '../../utils/save';
import { createJsonFile, downloadFile } from '../../utils/file-utils';
import messageManager from '../../utils/message-manager'
import { type CustomPrompt, getCustomPrompts, saveCustomPrompts, generatePromptId } from '../../utils/customPrompts';

const { Text } = Typography;

interface ExtensionPropsInterface {
    jumpToCaptions?: () => void;
}

const Extension = (_props: ExtensionPropsInterface) => {
    const { t } = useI18n();
    const [specificTags, setTags] = useState([]);
    const [inputVisible, setInputVisible] = useState(false);
    const [inputValue, setInputValue] = useState('');

    const inputRef = useRef<InputRef>(null);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [meetingNames, setMeetingNames] = useState<string[]>([]);
    const [selectedExportMeeting, setSelectedExportMeeting] = useState<string>('');
    const [pendingExportFormat, setPendingExportFormat] = useState<'txt' | 'json'>('txt');
    const [exportDate, setExportDate] = useState<Dayjs>(dayjs());

    // Font size offsets (relative px adjustment from base)
    const [captionFontOffset, setCaptionFontOffset] = useState(0);
    const [summaryFontOffset, setSummaryFontOffset] = useState(0);

    // Custom prompts
    const [customPrompts, setCustomPrompts] = useState<CustomPrompt[]>([]);
    const [promptModalOpen, setPromptModalOpen] = useState(false);
    const [editingPrompt, setEditingPrompt] = useState<CustomPrompt | null>(null);
    const [promptTitle, setPromptTitle] = useState('');
    const [promptContent, setPromptContent] = useState('');

    useEffect(() => {
        chrome.storage.local.get(['captionFontSizeOffset', 'summaryFontSizeOffset'], (result) => {
            setCaptionFontOffset(result.captionFontSizeOffset ?? 0);
            setSummaryFontOffset(result.summaryFontSizeOffset ?? 0);
        });
    }, []);

    useEffect(() => {
        getSpecificTags().then((res: string[]) => {
            setTags(res);
        });
    }, []);

    useEffect(() => {
        chrome.storage.local.set({ specificHighlightWords: specificTags });
    }, [specificTags]);

    useEffect(() => {
        getCustomPrompts().then(setCustomPrompts);
    }, []);

    const openAddPrompt = () => {
        setEditingPrompt(null);
        setPromptTitle('');
        setPromptContent('');
        setPromptModalOpen(true);
    };

    const openEditPrompt = (prompt: CustomPrompt) => {
        setEditingPrompt(prompt);
        setPromptTitle(prompt.title);
        setPromptContent(prompt.content);
        setPromptModalOpen(true);
    };

    const handlePromptSave = async () => {
        if (!promptTitle.trim() || !promptContent.trim()) return;
        let updated: CustomPrompt[];
        if (editingPrompt) {
            updated = customPrompts.map(p =>
                p.id === editingPrompt.id
                    ? { ...p, title: promptTitle.trim(), content: promptContent.trim() }
                    : p
            );
        } else {
            updated = [...customPrompts, {
                id: generatePromptId(),
                title: promptTitle.trim(),
                content: promptContent.trim(),
            }];
        }
        await saveCustomPrompts(updated);
        setCustomPrompts(updated);
        setPromptModalOpen(false);
    };

    const handlePromptDelete = async (id: string) => {
        const updated = customPrompts.filter(p => p.id !== id);
        await saveCustomPrompts(updated);
        setCustomPrompts(updated);
    };

    useEffect(() => {
        if (inputVisible) {
            inputRef.current?.focus();
        }
    }, [inputVisible]);

    const handleClose = (removedTag: string) => {
        setTags(specificTags.filter((tag) => tag !== removedTag));
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };

    const handleInputConfirm = () => {
        if (inputValue && specificTags.indexOf(inputValue) === -1) {
            setTags([...specificTags, inputValue]);
        }
        setInputVisible(false);
        setInputValue('');
    };

    const forMap = (tag: string) => (
        <span key={tag} style={{ display: 'inline-block' }}>
            <Tag closable onClose={() => handleClose(tag)}>
                {tag}
            </Tag>
        </span>
    );

    const tagChild = specificTags.map(forMap);

    // ── Export helpers ────────────────────────────────────────────────────────

    const doExport = (meetingName: string, transcripts: { meetingName: string; timestamp: string | number; talkContent: string; activeSpeaker: string; }[], format: 'txt' | 'json') => {
        const filtered = transcripts.filter(t =>
            t.meetingName === meetingName &&
            dayjs(t.timestamp).format('YYYY-MM-DD') === exportDate.format('YYYY-MM-DD')
        );

        if (filtered.length === 0) {
            messageManager.warning(t('no_data_found') || 'No data found for the selected meeting');
            return;
        }

        const safeName = meetingName.replace(/[^a-zA-Z0-9]/g, '_');
        const dateStr = exportDate.format('YYYY-MM-DD');

        if (format === 'json') {
            const file = createJsonFile(filtered, `${safeName}_${dateStr}.json`, { pretty: true });
            downloadFile(file);
        } else {
            let textContent = `Meeting: ${meetingName}\nDate: ${dateStr}\n\n`;
            filtered.forEach(tr => {
                const time = dayjs(tr.timestamp).format('HH:mm:ss');
                textContent += `[${time}] ${tr.activeSpeaker || 'Unknown'}: ${tr.talkContent || '(no content)'}\n\n`;
            });
            saveChatLogAsTxt(textContent, `${safeName}_${dateStr}.txt`);
        }

        messageManager.success(t('export_success') || 'Export successful');
    };

    const handleExport = (format: 'txt' | 'json') => {
        getMeetingCaptions(exportDate).then((transcripts) => {
            const uniqueMeetingNames = Array.from(new Set(
                transcripts
                    .filter(tr => dayjs(tr.timestamp).format('YYYY-MM-DD') === exportDate.format('YYYY-MM-DD'))
                    .map(tr => tr.meetingName || '')
                    .filter(name => name.trim() !== '')
            ));

            if (uniqueMeetingNames.length === 0) {
                messageManager.warning(t('no_meeting_data_for_export') || 'No meeting data available for export');
                return;
            }

            if (uniqueMeetingNames.length === 1) {
                doExport(uniqueMeetingNames[0], transcripts, format);
            } else {
                setPendingExportFormat(format);
                setMeetingNames(uniqueMeetingNames);
                setSelectedExportMeeting(uniqueMeetingNames[0]);
                setIsExportModalOpen(true);
            }
        });
    };

    const handleExportConfirm = () => {
        setIsExportModalOpen(false);
        if (selectedExportMeeting) {
            getMeetingCaptions(exportDate).then((transcripts) => {
                doExport(selectedExportMeeting, transcripts, pendingExportFormat);
            });
        }
    };

    return (
        <div className={'extension-container'}>
            <div className={'highlight-setting'}>
                {/* ── Specific highlight words ── */}
                <div className={'highlight-section'}>
                    <div className={'highlight-header'}>
                        <TagOutlined style={{ color: '#1a73e8' }} />
                        <span>{t('specific_highlight_words')}</span>
                    </div>
                    <div className={'highlight-description'}>
                        {t('specific_highlight_desc')}
                    </div>
                    <div className={'highlight-content'}>
                        <TweenOneGroup
                            appear={false}
                            enter={{scale: 0.8, opacity: 0, type: 'from', duration: 100}}
                            leave={{opacity: 0, width: 0, scale: 0, duration: 200}}
                            onEnd={(e) => {
                                if (e.type === 'appear' || e.type === 'enter') {
                                    (e.target as HTMLElement).style.display = 'inline-block';
                                }
                            }}
                        >
                            {tagChild}
                        </TweenOneGroup>
                        {inputVisible ? (
                            <Input
                                ref={inputRef}
                                type="text"
                                size="small"
                                style={{width: 120}}
                                value={inputValue}
                                onChange={handleInputChange}
                                onBlur={handleInputConfirm}
                                onPressEnter={handleInputConfirm}
                                className={'add-more'}
                                placeholder={t('enter_word')}
                            />
                        ) : (
                            <Tag onClick={() => setInputVisible(true)} className={'add-more'}>
                                <PlusOutlined /> {t('add_word')}
                            </Tag>
                        )}
                    </div>
                </div>

                {/* ── Font size control ── */}
                <div className="highlight-section">
                    <div className={'highlight-header'}>
                        <FontSizeOutlined style={{ color: '#1a73e8' }} />
                        <span>{t('font_size_control')}</span>
                    </div>
                    <div className={'highlight-description'}>
                        {t('font_size_control_desc')}
                    </div>
                    <div className="highlight-content" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {/* Captions row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ minWidth: '100px', fontSize: '14px', color: '#4a5568' }}>
                                {t('captions_font_size')}
                            </span>
                            <Button
                                size="small"
                                icon={<MinusOutlined />}
                                disabled={captionFontOffset <= -6}
                                onClick={() => {
                                    const next = captionFontOffset - 1;
                                    setCaptionFontOffset(next);
                                    chrome.storage.local.set({ captionFontSizeOffset: next });
                                }}
                            />
                            <span style={{ minWidth: '52px', textAlign: 'center', fontSize: '13px', color: '#718096' }}>
                                {16 + captionFontOffset}px {captionFontOffset !== 0 && `(${captionFontOffset > 0 ? '+' : ''}${captionFontOffset})`}
                            </span>
                            <Button
                                size="small"
                                icon={<PlusOutlined />}
                                disabled={captionFontOffset >= 10}
                                onClick={() => {
                                    const next = captionFontOffset + 1;
                                    setCaptionFontOffset(next);
                                    chrome.storage.local.set({ captionFontSizeOffset: next });
                                }}
                            />
                            {captionFontOffset !== 0 && (
                                <Button
                                    size="small"
                                    onClick={() => {
                                        setCaptionFontOffset(0);
                                        chrome.storage.local.set({ captionFontSizeOffset: 0 });
                                    }}
                                >
                                    {t('reset')}
                                </Button>
                            )}
                        </div>
                        {/* AI Summary row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ minWidth: '100px', fontSize: '14px', color: '#4a5568' }}>
                                {t('summary_font_size')}
                            </span>
                            <Button
                                size="small"
                                icon={<MinusOutlined />}
                                disabled={summaryFontOffset <= -6}
                                onClick={() => {
                                    const next = summaryFontOffset - 1;
                                    setSummaryFontOffset(next);
                                    chrome.storage.local.set({ summaryFontSizeOffset: next });
                                }}
                            />
                            <span style={{ minWidth: '52px', textAlign: 'center', fontSize: '13px', color: '#718096' }}>
                                {13 + summaryFontOffset}px {summaryFontOffset !== 0 && `(${summaryFontOffset > 0 ? '+' : ''}${summaryFontOffset})`}
                            </span>
                            <Button
                                size="small"
                                icon={<PlusOutlined />}
                                disabled={summaryFontOffset >= 10}
                                onClick={() => {
                                    const next = summaryFontOffset + 1;
                                    setSummaryFontOffset(next);
                                    chrome.storage.local.set({ summaryFontSizeOffset: next });
                                }}
                            />
                            {summaryFontOffset !== 0 && (
                                <Button
                                    size="small"
                                    onClick={() => {
                                        setSummaryFontOffset(0);
                                        chrome.storage.local.set({ summaryFontSizeOffset: 0 });
                                    }}
                                >
                                    {t('reset')}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Export captions ── */}
                <div className="highlight-section">
                    <div className={'highlight-header'}>
                        <FileTextOutlined style={{ color: '#1a73e8' }} />
                        <span>{t('export_captions_text')}</span>
                    </div>
                    <div className={'highlight-description'}>
                        {t('export_captions_desc')}
                    </div>
                    <div className="highlight-content">
                        <DatePicker
                            value={exportDate}
                            onChange={(date) => date && setExportDate(date)}
                            format="YYYY-MM-DD"
                            placeholder={t('select_date')}
                            style={{ marginBottom: '12px', maxWidth: '300px', width: '100%' }}
                            suffixIcon={<CalendarOutlined />}
                        />
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <Button
                                onClick={() => handleExport('txt')}
                                type="primary"
                                icon={<FileTextOutlined />}
                                className="action-button"
                            >
                                {t('export_as_txt')}
                            </Button>
                            <Button
                                onClick={() => handleExport('json')}
                                icon={<FileTextOutlined />}
                                className="action-button"
                            >
                                {t('export_as_json')}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* ── Custom Prompts ── */}
                <div className="highlight-section">
                    <div className={'highlight-header'}>
                        <RobotOutlined style={{ color: '#1a73e8' }} />
                        <span>{t('custom_prompts')}</span>
                    </div>
                    <div className={'highlight-description'}>
                        {t('custom_prompts_desc')}
                    </div>
                    <div className="highlight-content">
                        <List
                            dataSource={customPrompts}
                            locale={{ emptyText: t('custom_prompts_empty') }}
                            renderItem={(prompt) => (
                                <List.Item
                                    style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}
                                    actions={[
                                        <Button
                                            key="edit"
                                            type="text"
                                            size="small"
                                            icon={<EditOutlined />}
                                            onClick={() => openEditPrompt(prompt)}
                                        />,
                                        <Button
                                            key="delete"
                                            type="text"
                                            size="small"
                                            danger
                                            icon={<DeleteOutlined />}
                                            onClick={() => handlePromptDelete(prompt.id)}
                                        />,
                                    ]}
                                >
                                    <List.Item.Meta
                                        title={<span style={{ fontSize: '13px', fontWeight: 500 }}>{prompt.title}</span>}
                                        description={
                                            <span style={{ fontSize: '12px', color: '#888', display: 'block', maxWidth: '340px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {prompt.content}
                                            </span>
                                        }
                                    />
                                </List.Item>
                            )}
                        />
                        <Button
                            type="dashed"
                            icon={<PlusOutlined />}
                            onClick={openAddPrompt}
                            style={{ marginTop: '10px', width: '100%' }}
                        >
                            {t('add_prompt')}
                        </Button>
                    </div>
                </div>

                {/* ── Help & Guide ── */}
                <div className="highlight-section">
                    <div className={'highlight-header'}>
                        <QuestionCircleOutlined style={{ color: '#1a73e8' }} />
                        <span>{t('help_and_guide') || 'Help & Guide'}</span>
                    </div>
                    <div className={'highlight-description'}>
                        {t('help_guide_desc') || 'View the welcome guide to learn how to use this extension effectively.'}
                    </div>
                    <div className="highlight-content">
                        <Button
                            onClick={() => {
                                chrome.tabs.create({
                                    url: chrome.runtime.getURL('options.html#welcome')
                                });
                            }}
                            icon={<QuestionCircleOutlined />}
                            className="guide-button"
                        >
                            {t('open_welcome_guide') || 'Open Welcome Guide'}
                        </Button>
                    </div>
                </div>

                <Divider style={{ margin: '32px 0 24px' }} />

                {/* ── Prompt add/edit modal ── */}
                <Modal
                    title={editingPrompt ? t('edit_prompt') : t('add_prompt')}
                    open={promptModalOpen}
                    onOk={handlePromptSave}
                    onCancel={() => setPromptModalOpen(false)}
                    okText={t('save')}
                    cancelText={t('cancel')}
                    okButtonProps={{ disabled: !promptTitle.trim() || !promptContent.trim() }}
                    className="extension-modal"
                >
                    <Space direction="vertical" style={{ width: '100%' }} size={12}>
                        <div>
                            <div style={{ fontSize: '13px', color: '#555', marginBottom: '6px' }}>{t('prompt_title')}</div>
                            <Input
                                value={promptTitle}
                                onChange={e => setPromptTitle(e.target.value)}
                                placeholder={t('prompt_title_placeholder')}
                                maxLength={50}
                                showCount
                            />
                        </div>
                        <div>
                            <div style={{ fontSize: '13px', color: '#555', marginBottom: '6px' }}>{t('prompt_content')}</div>
                            <Input.TextArea
                                value={promptContent}
                                onChange={e => setPromptContent(e.target.value)}
                                placeholder={t('prompt_content_placeholder')}
                                rows={4}
                                maxLength={1000}
                                showCount
                            />
                        </div>
                    </Space>
                </Modal>

                {/* ── Select meeting modal ── */}
                <Modal
                    title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <FileTextOutlined style={{ color: '#1a73e8', fontSize: '20px' }} />
                            <span>{t('select_meeting_to_export')}</span>
                        </div>
                    }
                    open={isExportModalOpen}
                    onOk={handleExportConfirm}
                    onCancel={() => setIsExportModalOpen(false)}
                    okText={t('export')}
                    cancelText={t('cancel')}
                    className="extension-modal"
                >
                    <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>
                        {t('select_meeting_desc')}
                    </Text>
                    <Select
                        style={{ width: '100%' }}
                        value={selectedExportMeeting}
                        onChange={(value) => setSelectedExportMeeting(value)}
                        options={meetingNames.map(name => ({ value: name, label: name }))}
                    />
                </Modal>
            </div>
        </div>
    )
};

export default Extension
