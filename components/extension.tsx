import { PlusOutlined, TagOutlined, GlobalOutlined, CloudSyncOutlined, FileTextOutlined, QuestionCircleOutlined } from "@ant-design/icons"
import {Alert, Button, Input, Tag, theme, type InputRef, Modal, message, Typography, Divider, Select} from "antd"
import { TweenOneGroup } from "rc-tween-one"
import { useEffect, useRef, useState } from "react"
import dayjs from 'dayjs';

import { Actions } from "~components/captions/types"
import askAI from "../utils/askAI"
import {getDomain, getDomainTags, getSpecificTags} from "../utils/common";
import BackupAndRestore from "~components/backup-and-restore";
import { useI18n } from '../utils/i18n';
import getMeetingCaptions from '../utils/getCaptions';
import { useDateContext } from '../contexts/DateContext';
import saveChatLogAsTxt from '../utils/save';
import messageManager from '../utils/message-manager';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface ExtensionPropsInterface {
    jumpToCaptions?: () => void;
}

const Extension = (props: ExtensionPropsInterface) => {
    const { t } = useI18n();
    const [specificTags, setTags] = useState([]);
    const [domain, setDomain] = useState('');
    const [modalData, setModalData] = useState([]);
    const [domainTags, setDomainTags] = useState([]);
    const [inputVisible, setInputVisible] = useState(false);
    const [inputValue, setInputValue] = useState('');

    const inputRef = useRef<InputRef>(null);
    const [highlightWordsByDescriptions, setHighlightWordsByDescriptions] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [meetingNames, setMeetingNames] = useState<string[]>([]);
    const [selectedExportMeeting, setSelectedExportMeeting] = useState<string>('');
    const { selectedDate } = useDateContext();

    useEffect(() => {
        getSpecificTags().then((res: string[]) => {
            setTags(res);
        });

        getDomainTags().then((res: string[]) => {
            setDomainTags(res);
        });

        getDomain().then((res: string) => {
            setDomain(res);
        });
    }, []);

    useEffect(() => {
        chrome.storage.local.set({ specificHighlightWords: specificTags }, function() {
            console.log('specificTags is set to ' + specificTags);
        });
        chrome.storage.local.set({ highlightWordsByDescriptions: domainTags }, function() {
            console.log('domainTags is set to ' + domainTags);
        });
        chrome.storage.local.set({ domain: domain }, function() {
            console.log('domain is set to ' + domain);
        });

    }, [specificTags, domainTags, domain]);

    useEffect(() => {
        if (inputVisible) {
            inputRef.current?.focus();
        }
    }, [inputVisible]);

    const handleClose = (removedTag: string) => {
        const newTags = specificTags.filter((tag) => tag !== removedTag);
        console.log(newTags);
        setTags(newTags);
    };

    const showInput = () => {
        setInputVisible(true);
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
      <Tag
          closable
          onClose={(e) => {
              e.preventDefault();
              handleClose(tag);
          }}
      >
        {tag}
      </Tag>
    </span>
    );

    const removeHighlightWordInDomainTags = (word: string) => {
        const newDomainTags = domainTags.filter((tag) => tag !== word);
        setDomainTags(newDomainTags);
    };
    const forMapDomain = (tag: string) => (
        <span key={tag} style={{ display: 'inline-block' }}>
      <Tag
          closable
          onClose={(e) => {
              e.preventDefault();
              removeHighlightWordInDomainTags(tag);
          }}
      >
        {tag}
      </Tag>
    </span>
    );

    const tagChild = specificTags.map(forMap);
    const domainTagChild = domainTags.map(forMapDomain);


    const preview = () => {
        askAI(Actions.DEFAULT, `请直接返回一份Array数据，这个Array的每一个值都是单词或者单词缩写,我对这份数据的要求是: ${highlightWordsByDescriptions}，这份数据所属的行业是${domain}`).then((res) => {
            console.log('res', res);
            const stringWithOutJsonSymbol = res.replaceAll('```json', '').replaceAll('```', '');
            try {
                const data = JSON.parse(stringWithOutJsonSymbol);
                if (Array.isArray(data)) {
                    setModalData([...new Set(data)]);
                    showModal()
                } else {
                    messageManager.error('the response is not json array');
                }
            } catch (e) {
                messageManager.error('the response is not json valid');
            }


        })
    }

    const showModal = () => {
        setIsModalOpen(true);
    };

    const handleOk = () => {
        setIsModalOpen(false);
        setDomainTags(modalData);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
    };
    const removeHighlightWordInModalData = (word: string) => {
        const newModalData = modalData.filter((tag) => tag !== word);
        setModalData(newModalData);
    };

    // 处理导出会议聊天记录为txt文件
    const handleExportCaptionsText = () => {
        // 获取当前选择日期的会议记录
        getMeetingCaptions(selectedDate).then((transcripts) => {
            // 提取会议名称列表
            const uniqueMeetingNames = Array.from(new Set(
                transcripts
                    .filter(t => dayjs(t.timestamp).format('YYYY-MM-DD') === selectedDate.format('YYYY-MM-DD'))
                    .map(t => t.meetingName || '')
                    .filter(name => name.trim() !== '')
            ));
            
            // 如果没有会议记录
            if (uniqueMeetingNames.length === 0) {
                messageManager.warning(t('no_meeting_data_for_export') || 'No meeting data available for export');
                return;
            }
            
            // 如果只有一个会议，直接导出
            if (uniqueMeetingNames.length === 1) {
                exportMeetingCaptions(uniqueMeetingNames[0], transcripts);
            } else {
                // 如果有多个会议，弹出选择框
                setMeetingNames(uniqueMeetingNames);
                setSelectedExportMeeting(uniqueMeetingNames[0]);
                setIsExportModalOpen(true);
            }
        });
    };
    
    // 导出指定会议的聊天记录
    const exportMeetingCaptions = (meetingName: string, transcripts: any[]) => {
        // 筛选指定会议和日期的记录
        const filteredTranscripts = transcripts.filter(t => 
            t.meetingName === meetingName && 
            dayjs(t.timestamp).format('YYYY-MM-DD') === selectedDate.format('YYYY-MM-DD')
        );
        
        if (filteredTranscripts.length === 0) {
            messageManager.warning(t('no_data_found') || 'No data found for the selected meeting');
            return;
        }
        
        // 格式化聊天记录为文本
        let textContent = `Meeting: ${meetingName}\nDate: ${selectedDate.format('YYYY-MM-DD')}\n\n`;
        filteredTranscripts.forEach(transcript => {
            const time = dayjs(transcript.timestamp).format('HH:mm:ss');
            // 直接使用talkContent作为聊天内容
            const messageContent = transcript.talkContent || '(no content)';
            textContent += `[${time}] ${transcript.activeSpeaker || 'Unknown'}: ${messageContent}\n\n`;
        });
        
        // 导出为TXT文件
        const fileName = `${meetingName.replace(/[^a-zA-Z0-9]/g, '_')}_${selectedDate.format('YYYY-MM-DD')}.txt`;
        saveChatLogAsTxt(textContent, fileName);
        
        messageManager.success(t('export_success') || 'Export successful');
    };
    
    // 确认导出选择的会议
    const handleExportConfirm = () => {
        setIsExportModalOpen(false);
        if (selectedExportMeeting) {
            getMeetingCaptions(selectedDate).then((transcripts) => {
                exportMeetingCaptions(selectedExportMeeting, transcripts);
            });
        }
    };

    return (
        <div className={'extension-container'}>
            <div className={'highlight-setting'}>
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
                                    (e.target as any).style = 'display: inline-block';
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
                            <Tag onClick={showInput} className={'add-more'}>
                                <PlusOutlined /> {t('add_word')}
                            </Tag>
                        )}
                    </div>
                </div>

                <div className={'highlight-section'}>
                    <div className={'highlight-header'}>
                        <GlobalOutlined style={{ color: '#1a73e8' }} />
                        <span>{t('domain_specific_highlights')}</span>
                    </div>
                    <div className={'highlight-description'}>
                        {t('domain_specific_desc')}
                    </div>
                
                    <div className="highlight-content">
                        <Title level={5} style={{ marginBottom: '16px', color: '#2d3748' }}>{t('current_domain_tags')}</Title>
                        <TweenOneGroup
                            appear={false}
                            enter={{scale: 0.8, opacity: 0, type: 'from', duration: 100}}
                            leave={{opacity: 0, width: 0, scale: 0, duration: 200}}
                            onEnd={(e) => {
                                if (e.type === 'appear' || e.type === 'enter') {
                                    (e.target as any).style = 'display: inline-block';
                                }
                            }}
                        >
                            {domainTagChild}
                        </TweenOneGroup>
                        
                        <Input 
                            className='domain-inputer'
                            placeholder={t('domain_placeholder')}
                            value={domain}
                            onChange={(v) => {setDomain(v.target.value)}}
                            prefix={<GlobalOutlined style={{ color: '#a0aec0' }} />}
                        />
                        
                        <TextArea
                            rows={4}
                            placeholder={t('keywords_placeholder')}
                            onChange={(v) => { setHighlightWordsByDescriptions(v.target.value)}}
                            value={highlightWordsByDescriptions}
                        />
                        
                        <div className="valid-words">
                            <Button 
                                onClick={preview}
                                icon={<CloudSyncOutlined />}
                            >
                                {t('generate_keywords')}
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="highlight-section">
                    <div className={'highlight-header'}>
                        <FileTextOutlined style={{ color: '#1a73e8' }} />
                        <span>{t('export_captions_text') || 'Export Captions Text'}</span>
                    </div>
                    <div className={'highlight-description'}>
                        {t('export_captions_desc') || 'Export meeting captions as a text file for the selected date.'}
                    </div>
                    <div className="highlight-content">
                        <Button 
                            onClick={handleExportCaptionsText}
                            type="primary"
                            icon={<FileTextOutlined />}
                            className="action-button"
                        >
                            {t('export_captions_button') || 'Export as TXT'}
                        </Button>
                    </div>
                </div>

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
                            type="default"
                            icon={<QuestionCircleOutlined />}
                            className="action-button"
                        >
                            {t('open_welcome_guide') || 'Open Welcome Guide'}
                        </Button>
                    </div>
                </div>

                <Divider style={{ margin: '32px 0 24px' }} />
                
                <div className="backup-restore-container">
                    <BackupAndRestore />
                </div>

                <Modal
                    title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <TagOutlined style={{ color: '#1a73e8', fontSize: '20px' }} />
                            <span>{t('preview_keywords')}</span>
                        </div>
                    }
                    open={isModalOpen}
                    onOk={handleOk}
                    onCancel={handleCancel}
                    okText={t('apply_keywords')}
                    cancelText={t('cancel')}
                    className="extension-modal"
                >
                    <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>
                        {t('review_keywords')}
                    </Text>
                    <div>
                        {modalData.map((tag) => (
                            <span key={tag}>
                                <Tag
                                    closable
                                    onClose={(e) => {
                                        e.preventDefault();
                                        removeHighlightWordInModalData(tag);
                                    }}
                                >
                                    {tag}
                                </Tag>
                            </span>
                        ))}
                    </div>
                </Modal>

                <Modal
                    title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <FileTextOutlined style={{ color: '#1a73e8', fontSize: '20px' }} />
                            <span>{t('select_meeting_to_export') || 'Select Meeting to Export'}</span>
                        </div>
                    }
                    open={isExportModalOpen}
                    onOk={handleExportConfirm}
                    onCancel={() => setIsExportModalOpen(false)}
                    okText={t('export') || 'Export'}
                    cancelText={t('cancel') || 'Cancel'}
                    className="extension-modal"
                >
                    <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>
                        {t('select_meeting_desc') || 'Please select a meeting to export:'}
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
