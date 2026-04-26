import React, { useEffect, useState } from 'react';
import {
  RobotOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { Modal, Input } from 'antd';
import styled from 'styled-components';
import { useI18n } from '~/utils/i18n';
import AISettings from '~/components/options/ai-settings';
import TranslationSettings from '~/components/options/TranslationSettings';
import messageManager from '~/utils/message-manager';
import {
  type CustomPrompt,
  getCustomPrompts,
  saveCustomPrompts,
  generatePromptId,
} from '~/utils/customPrompts';

/* ── Styled Components ── */

const PageWrapper = styled.div`
  max-width: 800px;
  font-family: -apple-system, 'SF Pro Text', 'Helvetica Neue', 'Inter', sans-serif;
`;

const PageHeader = styled.div`
  padding: 0 20px 24px;
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

const Section = styled.div`
  padding: 0 20px;
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
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 340px;
`;

const RowValue = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: #8E8E93;
  font-size: 15px;
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

const Divider = styled.div`
  height: 24px;
`;

/* ── Component ── */

const AIAndTranslation: React.FC = () => {
  const { t } = useI18n();

  const [customPrompts, setCustomPrompts] = useState<CustomPrompt[]>([]);
  const [promptModalOpen, setPromptModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<CustomPrompt | null>(null);
  const [promptTitle, setPromptTitle] = useState('');
  const [promptContent, setPromptContent] = useState('');

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
    const updated = editingPrompt
      ? customPrompts.map((p) =>
          p.id === editingPrompt.id
            ? { ...p, title: promptTitle.trim(), content: promptContent.trim() }
            : p,
        )
      : [
          ...customPrompts,
          { id: generatePromptId(), title: promptTitle.trim(), content: promptContent.trim() },
        ];
    await saveCustomPrompts(updated);
    setCustomPrompts(updated);
    setPromptModalOpen(false);
    messageManager.success(t('configuration_saved'));
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

  return (
    <PageWrapper>
      <PageHeader>
        <PageTitle>{t('tab_ai_translation')}</PageTitle>
        <PageSubtitle>{t('tab_ai_translation_desc')}</PageSubtitle>
      </PageHeader>

      {/* AI Providers – uses its own internal layout */}
      <AISettings hideHeader />

      <Divider />

      {/* Custom Prompts */}
      <Section>
        <SectionLabel>{t('custom_prompts')}</SectionLabel>
        <SettingGroup>
          <SettingRow $clickable onClick={openAddPrompt} $last={customPrompts.length === 0}>
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

          {customPrompts.map((prompt, idx) => (
            <SettingRow
              key={prompt.id}
              $last={idx === customPrompts.length - 1}
              $clickable
              onClick={() => openEditPrompt(prompt)}
            >
              <div style={{ width: 32, flexShrink: 0 }} />
              <RowContent>
                <RowTitle style={{ fontSize: 14 }}>{prompt.title}</RowTitle>
                <RowSubtitle>{prompt.content}</RowSubtitle>
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
      </Section>

      <Divider />

      {/* Translation Settings */}
      <TranslationSettings hideHeader />

      {/* Add/Edit prompt modal */}
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
            <div style={{ marginBottom: 4, fontSize: 14, color: '#1C1C1E' }}>
              {t('prompt_title') || 'Title'}
            </div>
            <Input
              value={promptTitle}
              onChange={(e) => setPromptTitle(e.target.value)}
              placeholder={t('prompt_title_placeholder') || 'Enter prompt title'}
            />
          </div>
          <div>
            <div style={{ marginBottom: 4, fontSize: 14, color: '#1C1C1E' }}>
              {t('prompt_content') || 'Content'}
            </div>
            <Input.TextArea
              value={promptContent}
              onChange={(e) => setPromptContent(e.target.value)}
              placeholder={t('prompt_content_placeholder') || 'Enter prompt content'}
              rows={4}
              style={{ resize: 'none' }}
            />
          </div>
        </div>
      </Modal>
    </PageWrapper>
  );
};

export default AIAndTranslation;
