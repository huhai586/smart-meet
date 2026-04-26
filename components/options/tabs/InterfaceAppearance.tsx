import React, { useEffect, useRef, useState } from 'react';
import { Switch } from 'antd';
import {
  FileDoneOutlined,
  SketchOutlined,
  HistoryOutlined,
  TranslationOutlined,
  CheckCircleOutlined,
  CodeOutlined,
  BookOutlined,
  MessageOutlined,
  PushpinOutlined,
  TagOutlined,
  PlusOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { Input, Tag, type InputRef } from 'antd';
import { TweenOneGroup } from 'rc-tween-one';
import { Modal } from 'antd';
import styled from 'styled-components';
import { useI18n } from '~/utils/i18n';
import useCaptionToggle from '~/hooks/useCaptionToggle';
import useStickerToggle from '~/hooks/useStickerToggle';
import messageManager from '~/utils/message-manager';
import { getSpecificTags } from '~/utils/common';

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

const SettingRow = styled.div<{ $last?: boolean; $clickable?: boolean }>`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: #fff;
  border-bottom: ${({ $last }) => ($last ? 'none' : '0.5px solid rgba(60, 60, 67, 0.12)')};
  gap: 12px;
  transition: background 0.12s ease;
  cursor: ${({ $clickable }) => ($clickable ? 'pointer' : 'default')};

  &:hover {
    background: ${({ $clickable }) =>
      $clickable ? 'rgba(0, 0, 0, 0.03)' : 'rgba(0, 0, 0, 0.018)'};
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
  line-height: 1.4;
`;

const RowValue = styled.div`
  font-size: 15px;
  color: #8E8E93;
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
`;

const SectionFooter = styled.p`
  font-size: 12px;
  color: #8E8E93;
  padding: 6px 4px 20px;
  margin: 0;
  line-height: 1.5;
`;

const Chevron = styled(RightOutlined)`
  font-size: 12px;
  color: #C7C7CC;
`;

const TagCloud = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 4px 0 12px;
  min-height: 40px;
`;

/* ── Types ── */
interface SidepanelVisibility {
  captions: boolean;
  summary: boolean;
  translation: boolean;
  longman: boolean;
}

interface CaptionButtonsVisibility {
  translate: boolean;
  polish: boolean;
  analysis: boolean;
}

const SIDEPANEL_STORAGE_KEY = 'sidepanelVisibility';
const BUTTONS_STORAGE_KEY = 'captionButtonsVisibility';

/* ── Component ── */

const InterfaceAppearance: React.FC = () => {
  const { t } = useI18n();

  /* Sidepanel visibility */
  const [visibility, setVisibility] = useState<SidepanelVisibility>({
    captions: true,
    summary: true,
    translation: true,
    longman: false,
  });
  const [buttonsVisibility, setButtonsVisibility] = useState<CaptionButtonsVisibility>({
    translate: true,
    polish: true,
    analysis: true,
  });

  /* Meeting overlay */
  const [captionToggleEnabled, setCaptionToggleEnabled] = useCaptionToggle();
  const [stickerEnabled, setStickerEnabled] = useStickerToggle();

  /* Highlight words */
  const [specificTags, setTags] = useState<string[]>([]);
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [inputVisible, setInputVisible] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<InputRef>(null);

  useEffect(() => {
    chrome.storage.local.get([SIDEPANEL_STORAGE_KEY, BUTTONS_STORAGE_KEY], (result) => {
      if (result[SIDEPANEL_STORAGE_KEY]) setVisibility(result[SIDEPANEL_STORAGE_KEY]);
      if (result[BUTTONS_STORAGE_KEY]) setButtonsVisibility(result[BUTTONS_STORAGE_KEY]);
    });
  }, []);

  useEffect(() => {
    getSpecificTags().then((res: string[]) => setTags(res));
  }, []);

  useEffect(() => {
    chrome.storage.local.set({ specificHighlightWords: specificTags });
  }, [specificTags]);

  useEffect(() => {
    if (inputVisible) inputRef.current?.focus();
  }, [inputVisible]);

  const updateVisibility = (key: keyof SidepanelVisibility, value: boolean) => {
    const next = { ...visibility, [key]: value };
    setVisibility(next);
    chrome.storage.local.set({ [SIDEPANEL_STORAGE_KEY]: next });
  };

  const updateButtonsVisibility = (key: keyof CaptionButtonsVisibility, value: boolean) => {
    const next = { ...buttonsVisibility, [key]: value };
    setButtonsVisibility(next);
    chrome.storage.local.set({ [BUTTONS_STORAGE_KEY]: next });
  };

  const handleCaptionToggleChange = (checked: boolean) => {
    setCaptionToggleEnabled(checked);
    messageManager.success(
      checked ? t('caption_toggle_enabled') : t('caption_toggle_disabled'),
    );
  };

  const handleStickerToggleChange = (checked: boolean) => {
    setStickerEnabled(checked);
    messageManager.success(checked ? t('sticker_enabled') : t('sticker_disabled'));
  };

  const handleTagClose = (tag: string) => setTags(specificTags.filter((t) => t !== tag));

  const handleInputConfirm = () => {
    if (inputValue && !specificTags.includes(inputValue)) {
      setTags([...specificTags, inputValue]);
    }
    setInputVisible(false);
    setInputValue('');
  };

  const tabItems: {
    key: keyof SidepanelVisibility;
    icon: React.ReactNode;
    color: string;
    label: string;
  }[] = [
    { key: 'captions', icon: <FileDoneOutlined />, color: '#007AFF', label: t('captions') },
    { key: 'summary', icon: <SketchOutlined />, color: '#5E5CE6', label: t('sidepanel_summary') },
    {
      key: 'translation',
      icon: <HistoryOutlined />,
      color: '#007AFF',
      label: t('translation_records'),
    },
    { key: 'longman', icon: <BookOutlined />, color: '#FF9500', label: t('longman_3000') },
  ];

  const buttonItems: {
    key: keyof CaptionButtonsVisibility;
    icon: React.ReactNode;
    color: string;
    label: string;
  }[] = [
    {
      key: 'translate',
      icon: <TranslationOutlined />,
      color: '#007AFF',
      label: t('translate'),
    },
    { key: 'polish', icon: <CheckCircleOutlined />, color: '#34C759', label: t('polish') },
    { key: 'analysis', icon: <CodeOutlined />, color: '#5E5CE6', label: t('analysis') },
  ];

  return (
    <PageWrapper>
      <PageHeader>
        <PageTitle>{t('tab_interface')}</PageTitle>
        <PageSubtitle>{t('tab_interface_desc')}</PageSubtitle>
      </PageHeader>

      {/* Sidepanel Tab Visibility */}
      <SectionLabel>{t('sidepanel_visibility_settings')}</SectionLabel>
      <SettingGroup>
        {tabItems.map((item, idx) => (
          <SettingRow key={item.key} $last={idx === tabItems.length - 1}>
            <IconSquircle $color={item.color}>{item.icon}</IconSquircle>
            <RowContent>
              <RowTitle>{item.label}</RowTitle>
            </RowContent>
            <Switch
              checked={visibility[item.key]}
              onChange={(checked) => updateVisibility(item.key, checked)}
            />
          </SettingRow>
        ))}
      </SettingGroup>
      <SectionFooter>{t('sidepanel_visibility_desc')}</SectionFooter>

      {/* Caption Action Buttons */}
      <SectionLabel>{t('caption_buttons_visibility_settings')}</SectionLabel>
      <SettingGroup>
        {buttonItems.map((item, idx) => (
          <SettingRow key={item.key} $last={idx === buttonItems.length - 1}>
            <IconSquircle $color={item.color}>{item.icon}</IconSquircle>
            <RowContent>
              <RowTitle>{item.label}</RowTitle>
            </RowContent>
            <Switch
              checked={buttonsVisibility[item.key]}
              onChange={(checked) => updateButtonsVisibility(item.key, checked)}
            />
          </SettingRow>
        ))}
      </SettingGroup>
      <SectionFooter>{t('caption_buttons_visibility_desc')}</SectionFooter>

      {/* Meeting Overlay */}
      <SectionLabel>{t('meeting_interface')}</SectionLabel>
      <SettingGroup>
        <SettingRow>
          <IconSquircle $color="#007AFF">
            <MessageOutlined />
          </IconSquircle>
          <RowContent>
            <RowTitle>{t('caption_toggle_button')}</RowTitle>
            <RowSubtitle>{t('caption_toggle_button_desc')}</RowSubtitle>
          </RowContent>
          <Switch checked={captionToggleEnabled} onChange={handleCaptionToggleChange} />
        </SettingRow>
        <SettingRow $last>
          <IconSquircle $color="#FF9500">
            <PushpinOutlined />
          </IconSquircle>
          <RowContent>
            <RowTitle>{t('sticker_note')}</RowTitle>
            <RowSubtitle>{t('sticker_note_desc')}</RowSubtitle>
          </RowContent>
          <Switch checked={stickerEnabled} onChange={handleStickerToggleChange} />
        </SettingRow>
      </SettingGroup>
      <SectionFooter>{t('meeting_interface_desc')}</SectionFooter>

      {/* Caption Highlights */}
      <SectionLabel>{t('highlight_words_section')}</SectionLabel>
      <SettingGroup>
        <SettingRow $last $clickable onClick={() => setTagModalOpen(true)}>
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
      </SettingGroup>
      <SectionFooter>{t('specific_highlight_desc')}</SectionFooter>

      {/* Tag management modal */}
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
                  onClose={() => handleTagClose(tag)}
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
    </PageWrapper>
  );
};

export default InterfaceAppearance;
