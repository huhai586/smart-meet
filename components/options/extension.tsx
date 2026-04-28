import {
  PlusOutlined,
  TagOutlined,
  FileTextOutlined,
  QuestionCircleOutlined,
  CalendarOutlined,
  FontSizeOutlined,
  MinusOutlined,
  EditOutlined,
  DeleteOutlined,
  RobotOutlined,
  RightOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import {
  Button,
  Input,
  Tag,
  type InputRef,
  Modal,
  Select,
  DatePicker,
  Dropdown,
} from 'antd';
import { TweenOneGroup } from 'rc-tween-one';
import { useEffect, useRef, useState } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import styled from 'styled-components';

import { getSpecificTags } from '../../utils/common';
import { useI18n } from '../../utils/i18n';
import getMeetingCaptions from '../../utils/getCaptions';
import saveChatLogAsTxt from '../../utils/save';
import { createJsonFile, downloadFile } from '../../utils/file-utils';
import messageManager from '../../utils/message-manager';
import {
  type CustomPrompt,
  getCustomPrompts,
  saveCustomPrompts,
  generatePromptId,
} from '../../utils/customPrompts';

/* ── Styled Components ── */

const PageWrapper = styled.div`
  padding: 0 20px;
  max-width: 800px;
  font-family: -apple-system, 'SF Pro Text', 'Helvetica Neue', 'Inter', sans-serif;
`;

const PageHeader = styled.div`
  padding: 0 0 24px;
`;

const PageTitle = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: #1C1C1E;
  letter-spacing: -0.5px;
  margin: 0 0 4px;
  font-family: -apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif;
`;

const PageSubtitle = styled.p`
  font-size: 13px;
  color: #8E8E93;
  margin: 0;
  line-height: 1.4;
`;

const SectionLabel = styled.div`
  font-size: 12px;
  font-weight: 500;
  color: #8E8E93;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  padding: 0 4px 8px;
`;

const SettingGroup = styled.div`
  background: #fff;
  border-radius: 12px;
  border: 0.5px solid rgba(60, 60, 67, 0.14);
  overflow: hidden;
  margin-bottom: 8px;
`;

const SettingRow = styled.div<{ $last?: boolean; $clickable?: boolean; $danger?: boolean }>`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: #fff;
  border-bottom: ${({ $last }) => ($last ? 'none' : '0.5px solid rgba(60, 60, 67, 0.12)')};
  gap: 12px;
  cursor: ${({ $clickable }) => ($clickable ? 'pointer' : 'default')};
  transition: background 0.12s ease;

  &:hover {
    background: ${({ $clickable }) => ($clickable ? 'rgba(0,0,0,0.03)' : 'transparent')};
  }
`;

const IconSquircle = styled.div<{ $color: string }>`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: ${({ $color }) => $color};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #fff;
  font-size: 15px;
`;

const RowContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const RowTitle = styled.div`
  font-size: 15px;
  font-weight: 400;
  color: #1C1C1E;
  line-height: 1.3;
`;

const RowSubtitle = styled.div`
  font-size: 12px;
  color: #8E8E93;
  margin-top: 2px;
`;

const RowValue = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: #8E8E93;
  font-size: 15px;
  flex-shrink: 0;
`;

const Chevron = styled(RightOutlined)`
  font-size: 12px;
  color: #C7C7CC;
`;

/* Stepper */
const StepperWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 0;
  border: 0.5px solid rgba(60, 60, 67, 0.3);
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
`;

const StepperBtn = styled.button<{ $disabled?: boolean }>`
  width: 32px;
  height: 28px;
  background: none;
  border: none;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: ${({ $disabled }) => ($disabled ? '#C7C7CC' : '#007AFF')};
  transition: background 0.1s ease;

  &:hover:not(:disabled) {
    background: rgba(0, 122, 255, 0.08);
  }
`;

const StepperValue = styled.div`
  padding: 0 10px;
  font-size: 14px;
  font-weight: 500;
  color: #1C1C1E;
  min-width: 46px;
  text-align: center;
  border-left: 0.5px solid rgba(60, 60, 67, 0.2);
  border-right: 0.5px solid rgba(60, 60, 67, 0.2);
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const SectionFooter = styled.p`
  font-size: 12px;
  color: #8E8E93;
  padding: 6px 4px 20px;
  margin: 0;
  line-height: 1.5;
`;

/* Tag cloud in modal */
const TagCloud = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 4px 0 12px;
  min-height: 40px;
`;

/* Export primary action row */
const ExportActionRow = styled.div<{ $last?: boolean }>`
  padding: 12px 16px;
  border-bottom: ${({ $last }) => ($last ? 'none' : '0.5px solid rgba(60, 60, 67, 0.12)')};
`;

const ExportButton = styled.button`
  background: none;
  border: none;
  padding: 0;
  font-size: 15px;
  font-weight: 500;
  color: #007AFF;
  cursor: pointer;
  font-family: -apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif;
  transition: opacity 0.12s ease;

  &:hover {
    opacity: 0.75;
  }
`;

/* ── Stepper component ── */
const Stepper: React.FC<{
  value: number;
  min: number;
  max: number;
  base: number;
  onChange: (v: number) => void;
}> = ({ value, min, max, base, onChange }) => (
  <StepperWrap>
    <StepperBtn $disabled={value <= min} onClick={() => value > min && onChange(value - 1)}>
      <MinusOutlined />
    </StepperBtn>
    <StepperValue>{base + value}px</StepperValue>
    <StepperBtn $disabled={value >= max} onClick={() => value < max && onChange(value + 1)}>
      <PlusOutlined />
    </StepperBtn>
  </StepperWrap>
);

/* ── Main component ── */
interface ExtensionPropsInterface {
  jumpToCaptions?: () => void;
}

const Extension = (_props: ExtensionPropsInterface) => {
  const { t } = useI18n();

  /* — Tags — */
  const [specificTags, setTags] = useState<string[]>([]);
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [inputVisible, setInputVisible] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<InputRef>(null);

  /* — Export — */
  const [exportDate, setExportDate] = useState<Dayjs>(dayjs());
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [meetingNames, setMeetingNames] = useState<string[]>([]);
  const [selectedExportMeeting, setSelectedExportMeeting] = useState('');
  const [pendingExportFormat, setPendingExportFormat] = useState<'txt' | 'json'>('txt');

  /* — Font sizes — */
  const [captionFontOffset, setCaptionFontOffset] = useState(0);
  const [summaryFontOffset, setSummaryFontOffset] = useState(0);

  /* — Custom prompts — */
  const [customPrompts, setCustomPrompts] = useState<CustomPrompt[]>([]);
  const [promptModalOpen, setPromptModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<CustomPrompt | null>(null);
  const [promptTitle, setPromptTitle] = useState('');
  const [promptContent, setPromptContent] = useState('');

  /* ── Effects ── */
  useEffect(() => {
    chrome.storage.sync.get(['captionFontSizeOffset', 'summaryFontSizeOffset'], (result) => {
      setCaptionFontOffset(result.captionFontSizeOffset ?? 0);
      setSummaryFontOffset(result.summaryFontSizeOffset ?? 0);
    });
  }, []);

  useEffect(() => {
    getSpecificTags().then((res: string[]) => setTags(res));
  }, []);

  useEffect(() => {
    chrome.storage.sync.set({ specificHighlightWords: specificTags });
  }, [specificTags]);

  useEffect(() => {
    getCustomPrompts().then(setCustomPrompts);
  }, []);

  useEffect(() => {
    if (inputVisible) inputRef.current?.focus();
  }, [inputVisible]);

  /* ── Tag handlers ── */
  const handleClose = (tag: string) => setTags(specificTags.filter((t) => t !== tag));

  const handleInputConfirm = () => {
    if (inputValue && !specificTags.includes(inputValue)) {
      setTags([...specificTags, inputValue]);
    }
    setInputVisible(false);
    setInputValue('');
  };

  /* ── Font size handlers ── */
  const handleCaptionFont = (next: number) => {
    setCaptionFontOffset(next);
    chrome.storage.sync.set({ captionFontSizeOffset: next });
  };

  const handleSummaryFont = (next: number) => {
    setSummaryFontOffset(next);
    chrome.storage.sync.set({ summaryFontSizeOffset: next });
  };

  /* ── Export helpers ── */
  const doExport = (
    meetingName: string,
    transcripts: { meetingName: string; timestamp: string | number; talkContent: string; activeSpeaker: string }[],
    format: 'txt' | 'json',
  ) => {
    const filtered = transcripts.filter(
      (tr) =>
        tr.meetingName === meetingName &&
        dayjs(tr.timestamp).format('YYYY-MM-DD') === exportDate.format('YYYY-MM-DD'),
    );
    if (!filtered.length) {
      messageManager.warning(t('no_data_found') || 'No data found for the selected meeting');
      return;
    }
    const safeName = meetingName.replace(/[^a-zA-Z0-9]/g, '_');
    const dateStr = exportDate.format('YYYY-MM-DD');
    if (format === 'json') {
      const file = createJsonFile(filtered, `${safeName}_${dateStr}.json`, { pretty: true });
      downloadFile(file);
    } else {
      let txt = `Meeting: ${meetingName}\nDate: ${dateStr}\n\n`;
      filtered.forEach((tr) => {
        const time = dayjs(tr.timestamp).format('HH:mm:ss');
        txt += `[${time}] ${tr.activeSpeaker || 'Unknown'}: ${tr.talkContent || '(no content)'}\n\n`;
      });
      saveChatLogAsTxt(txt, `${safeName}_${dateStr}.txt`);
    }
    messageManager.success(t('export_success') || 'Export successful');
  };

  const handleExport = (format: 'txt' | 'json') => {
    getMeetingCaptions(exportDate).then((transcripts) => {
      const names = Array.from(
        new Set(
          transcripts
            .filter((tr) => dayjs(tr.timestamp).format('YYYY-MM-DD') === exportDate.format('YYYY-MM-DD'))
            .map((tr) => tr.meetingName || '')
            .filter((n) => n.trim()),
        ),
      );
      if (!names.length) {
        messageManager.warning(t('no_meeting_data_for_export') || 'No meeting data available');
        return;
      }
      if (names.length === 1) {
        doExport(names[0], transcripts, format);
      } else {
        setPendingExportFormat(format);
        setMeetingNames(names);
        setSelectedExportMeeting(names[0]);
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

  /* ── Prompt handlers ── */
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
    const updated = editingPrompt
      ? customPrompts.map((p) =>
          p.id === editingPrompt.id ? { ...p, title: promptTitle.trim(), content: promptContent.trim() } : p,
        )
      : [...customPrompts, { id: generatePromptId(), title: promptTitle.trim(), content: promptContent.trim() }];
    await saveCustomPrompts(updated);
    setCustomPrompts(updated);
    setPromptModalOpen(false);
  };

  const handlePromptDelete = async (id: string) => {
    Modal.confirm({
      title: t('delete_prompt') || 'Delete Prompt',
      content: t('delete_prompt_confirm') || 'Are you sure you want to delete this prompt?',
      okText: t('yes'),
      cancelText: t('cancel'),
      okButtonProps: { danger: true },
      centered: true,
      onOk: async () => {
        const updated = customPrompts.filter((p) => p.id !== id);
        await saveCustomPrompts(updated);
        setCustomPrompts(updated);
      },
    });
  };

  /* ── Export dropdown items ── */
  const exportMenuItems = [
    {
      key: 'txt',
      icon: <FileTextOutlined />,
      label: t('export_as_txt'),
      onClick: () => handleExport('txt'),
    },
    {
      key: 'json',
      icon: <FileTextOutlined />,
      label: t('export_as_json'),
      onClick: () => handleExport('json'),
    },
  ];

  return (
    <PageWrapper>
      <PageHeader>
        <PageTitle>{t('extension_settings')}</PageTitle>
        <PageSubtitle>{t('extension_settings_desc')}</PageSubtitle>
      </PageHeader>

      {/* ── Section 1: Interface Appearance ── */}
      <SectionLabel>{t('font_size_control') || 'Appearance'}</SectionLabel>
      <SettingGroup>
        {/* Caption font size */}
        <SettingRow>
          <IconSquircle $color="#007AFF">
            <FontSizeOutlined />
          </IconSquircle>
          <RowContent>
            <RowTitle>{t('captions_font_size')}</RowTitle>
          </RowContent>
          <Stepper
            value={captionFontOffset}
            min={-6}
            max={10}
            base={16}
            onChange={handleCaptionFont}
          />
        </SettingRow>

        {/* AI Summary font size */}
        <SettingRow $last>
          <IconSquircle $color="#5E5CE6">
            <FontSizeOutlined />
          </IconSquircle>
          <RowContent>
            <RowTitle>{t('summary_font_size')}</RowTitle>
          </RowContent>
          <Stepper
            value={summaryFontOffset}
            min={-6}
            max={10}
            base={13}
            onChange={handleSummaryFont}
          />
        </SettingRow>
      </SettingGroup>
      <SectionFooter>{t('font_size_control_desc')}</SectionFooter>

      {/* ── Section 2: Caption Processing ── */}
      <SectionLabel>{t('export_captions_text') || 'Captions'}</SectionLabel>
      <SettingGroup>
        {/* Highlight words — opens tag modal */}
        <SettingRow $clickable onClick={() => setTagModalOpen(true)}>
          <IconSquircle $color="#FF9500">
            <TagOutlined />
          </IconSquircle>
          <RowContent>
            <RowTitle>{t('specific_highlight_words')}</RowTitle>
          </RowContent>
          <RowValue>
            {specificTags.length > 0 && <span>{specificTags.length}</span>}
            <Chevron />
          </RowValue>
        </SettingRow>

        {/* Export date */}
        <SettingRow>
          <IconSquircle $color="#34C759">
            <CalendarOutlined />
          </IconSquircle>
          <RowContent>
            <RowTitle>{t('select_date') || 'Export Date'}</RowTitle>
          </RowContent>
          <RowValue>
            <DatePicker
              value={exportDate}
              onChange={(date) => date && setExportDate(date)}
              format="YYYY-MM-DD"
              variant="borderless"
              size="small"
              style={{ color: '#8E8E93' }}
            />
          </RowValue>
        </SettingRow>

        {/* Export action */}
        <ExportActionRow $last>
          <Dropdown menu={{ items: exportMenuItems }} trigger={['click']} placement="bottomLeft">
            <ExportButton>{t('export_captions_text') || 'Export Captions'}…</ExportButton>
          </Dropdown>
        </ExportActionRow>
      </SettingGroup>
      <SectionFooter>{t('export_captions_desc')}</SectionFooter>

      {/* ── Section 3: Advanced ── */}
      <SectionLabel>{t('custom_prompts') || 'Advanced'}</SectionLabel>
      <SettingGroup>
        {/* Custom prompts — row + inline list */}
        <SettingRow $clickable onClick={openAddPrompt}>
          <IconSquircle $color="#5E5CE6">
            <RobotOutlined />
          </IconSquircle>
          <RowContent>
            <RowTitle>{t('custom_prompts')}</RowTitle>
          </RowContent>
          <RowValue>
            {customPrompts.length > 0 && <span>{customPrompts.length}</span>}
            <PlusOutlined style={{ color: '#007AFF', fontSize: 14 }} />
          </RowValue>
        </SettingRow>

        {/* Individual prompt rows */}
        {customPrompts.map((prompt, idx) => (
          <SettingRow key={prompt.id} $last={idx === customPrompts.length - 1} $clickable onClick={() => openEditPrompt(prompt)}>
            <div style={{ width: 32, flexShrink: 0 }} />
            <RowContent>
              <RowTitle style={{ fontSize: 14 }}>{prompt.title}</RowTitle>
              <RowSubtitle
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: 340,
                }}
              >
                {prompt.content}
              </RowSubtitle>
            </RowContent>
            <RowValue>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 6px',
                  color: '#FF3B30',
                  fontSize: 14,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handlePromptDelete(prompt.id);
                }}
              >
                <DeleteOutlined />
              </button>
              <Chevron />
            </RowValue>
          </SettingRow>
        ))}
      </SettingGroup>
      <SectionFooter>{t('custom_prompts_desc')}</SectionFooter>

      {/* ── Section 4: Support ── */}
      <SectionLabel>{t('help_and_guide') || 'Support'}</SectionLabel>
      <SettingGroup>
        <SettingRow
          $last
          $clickable
          onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL('options.html#welcome') })}
        >
          <IconSquircle $color="#007AFF">
            <QuestionCircleOutlined />
          </IconSquircle>
          <RowContent>
            <RowTitle>{t('open_welcome_guide') || 'Welcome Guide'}</RowTitle>
          </RowContent>
          <RowValue>
            <Chevron />
          </RowValue>
        </SettingRow>
      </SettingGroup>

      {/* ── Tag management modal ── */}
      <Modal
        title={t('specific_highlight_words')}
        open={tagModalOpen}
        onCancel={() => setTagModalOpen(false)}
        footer={null}
        centered
        styles={{ content: { borderRadius: 14 } }}
      >
        <TagCloud>
          <TweenOneGroup
            appear={false}
            enter={{ scale: 0.8, opacity: 0, type: 'from', duration: 100 }}
            leave={{ opacity: 0, width: 0, scale: 0, duration: 200 }}
            onEnd={(e) => {
              if (e.type === 'appear' || e.type === 'enter') {
                (e.target as HTMLElement).style.display = 'inline-block';
              }
            }}
          >
            {specificTags.map((tag) => (
              <span key={tag} style={{ display: 'inline-block', margin: '0 4px 4px 0' }}>
                <Tag
                  closable
                  onClose={() => handleClose(tag)}
                  style={{ borderRadius: 20, fontSize: 13, padding: '2px 10px' }}
                >
                  {tag}
                </Tag>
              </span>
            ))}
          </TweenOneGroup>
        </TagCloud>
        {inputVisible ? (
          <Input
            ref={inputRef}
            size="small"
            style={{ width: 140, borderRadius: 8 }}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={handleInputConfirm}
            onPressEnter={handleInputConfirm}
            placeholder={t('enter_word')}
          />
        ) : (
          <Tag
            onClick={() => setInputVisible(true)}
            style={{
              borderStyle: 'dashed',
              cursor: 'pointer',
              borderRadius: 20,
              fontSize: 13,
              padding: '2px 10px',
              color: '#007AFF',
              borderColor: '#007AFF',
              background: 'rgba(0,122,255,0.05)',
            }}
          >
            <PlusOutlined /> {t('add_word')}
          </Tag>
        )}
      </Modal>

      {/* ── Prompt add/edit modal ── */}
      <Modal
        title={editingPrompt ? t('edit_prompt') : t('add_prompt')}
        open={promptModalOpen}
        onOk={handlePromptSave}
        onCancel={() => setPromptModalOpen(false)}
        okText={t('save')}
        cancelText={t('cancel')}
        okButtonProps={{ disabled: !promptTitle.trim() || !promptContent.trim() }}
        centered
        destroyOnClose
        styles={{ content: { borderRadius: 14 } }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
          <div>
            <div style={{ fontSize: 13, color: '#8E8E93', marginBottom: 6 }}>{t('prompt_title')}</div>
            <Input
              value={promptTitle}
              onChange={(e) => setPromptTitle(e.target.value)}
              placeholder={t('prompt_title_placeholder')}
              maxLength={50}
              showCount
              style={{ borderRadius: 8 }}
            />
          </div>
          <div>
            <div style={{ fontSize: 13, color: '#8E8E93', marginBottom: 6 }}>{t('prompt_content')}</div>
            <Input.TextArea
              value={promptContent}
              onChange={(e) => setPromptContent(e.target.value)}
              placeholder={t('prompt_content_placeholder')}
              rows={4}
              maxLength={1000}
              style={{ borderRadius: 8 }}
            />
            <div style={{ textAlign: 'right', fontSize: 12, color: '#C7C7CC', marginTop: 4 }}>
              {promptContent.length} / 1000
            </div>
          </div>
        </div>
      </Modal>

      {/* ── Select meeting modal ── */}
      <Modal
        title={t('select_meeting_to_export')}
        open={isExportModalOpen}
        onOk={handleExportConfirm}
        onCancel={() => setIsExportModalOpen(false)}
        okText={t('export')}
        cancelText={t('cancel')}
        centered
        destroyOnClose
        styles={{ content: { borderRadius: 14 } }}
      >
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 13, color: '#8E8E93', marginBottom: 10 }}>
            {t('select_meeting_desc')}
          </div>
          <Select
            style={{ width: '100%', borderRadius: 8 }}
            value={selectedExportMeeting}
            onChange={(value) => setSelectedExportMeeting(value)}
            options={meetingNames.map((name) => ({ value: name, label: name }))}
          />
        </div>
      </Modal>
    </PageWrapper>
  );
};

export default Extension;
