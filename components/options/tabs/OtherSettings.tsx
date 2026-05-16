import React, { useEffect, useRef, useState } from 'react';
import { Input, Tag, Modal } from 'antd';
import type { InputRef } from 'antd';
import { TagOutlined, PlusOutlined } from '@ant-design/icons';
import { TweenOneGroup } from 'rc-tween-one';
import styled from 'styled-components';
import { useI18n } from '~/utils/i18n';
import { setConfigValue } from '~/utils/appConfig';
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

const Chevron = styled(({ className }: { className?: string }) => (
  <span className={className}>›</span>
))`
  font-size: 18px;
  color: #C7C7CC;
  line-height: 1;
`;

const TagCloud = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 4px 0 12px;
  min-height: 40px;
`;

/* ── Component ── */

const OtherSettings: React.FC = () => {
  const { t } = useI18n();

  const [specificTags, setTags] = useState<string[]>([]);
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [inputVisible, setInputVisible] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<InputRef>(null);

  useEffect(() => {
    getSpecificTags().then((res: string[]) => setTags(res));
  }, []);

  useEffect(() => {
    setConfigValue('specificHighlightWords', specificTags);
  }, [specificTags]);

  useEffect(() => {
    if (inputVisible) inputRef.current?.focus();
  }, [inputVisible]);

  const handleTagClose = (tag: string) => setTags(specificTags.filter((t) => t !== tag));

  const handleInputConfirm = () => {
    if (inputValue && !specificTags.includes(inputValue)) {
      setTags([...specificTags, inputValue]);
    }
    setInputVisible(false);
    setInputValue('');
  };

  return (
    <PageWrapper>
      <PageHeader>
        <PageTitle>{t('tab_other')}</PageTitle>
        <PageSubtitle>{t('tab_other_desc')}</PageSubtitle>
      </PageHeader>

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

export default OtherSettings;
