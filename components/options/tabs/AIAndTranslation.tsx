import React, { useEffect, useState } from 'react';
import {
  RobotOutlined,
  DeleteOutlined,
  PlusOutlined,
  RightOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { Modal, Input } from 'antd';
import styled from 'styled-components';
import { useI18n } from '~/utils/i18n';
import AISettings from '~/components/options/ai-settings';
import messageManager from '~/utils/message-manager';
import PageShell, { PageWidth } from '~components/options/PageShell';
import { OptionsRoute } from '~utils/options-routes';
import {
  type CustomPrompt,
  getCustomPrompts,
  saveCustomPrompts,
  generatePromptId,
} from '~/utils/customPrompts';

/* ── Styled Components ── */

/* ── Segmented Control ── */
const SegmentBar = styled.div`
  display: flex;
  padding: 0 0 16px;
`;

const SegmentTrack = styled.div`
  display: flex;
  background: var(--opt-segment-bg);
  border-radius: 10px;
  padding: 2px;
  gap: 0;
`;

const SegBtn = styled.button<{ $active: boolean }>`
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 20px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, box-shadow 0.15s;
  font-family: -apple-system, 'SF Pro Text', BlinkMacSystemFont, sans-serif;
  background: ${({ $active }) => ($active ? 'var(--opt-segment-active)' : 'transparent')};
  color: ${({ $active }) => ($active ? 'var(--opt-segment-text-on)' : 'var(--opt-segment-text-off)')};
  box-shadow: ${({ $active }) => ($active ? '0 1px 3px rgba(0,0,0,0.12)' : 'none')};
  white-space: nowrap;

  &:hover {
    color: var(--opt-text-primary);
  }
`;

/* ── Tab content wrapper ── */
const TabPane = styled.div`
  flex: 1;
  min-height: 0;
`;

// The model list and its settings: one rounded card, not two loose panels
const ModelsCard = styled(TabPane)`
  height: calc(100vh - 320px);
  min-height: 480px;
  max-height: 760px;
  border-radius: 14px;
  overflow: hidden;
  border: 0.5px solid var(--opt-border-subtle);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
`;

/* ── Prompts Tab ── */
const PromptsPane = styled.div``;

const PaneSectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const SectionLabel = styled.div`
  font-size: 12px;
  font-weight: 500;
  color: #8E8E93;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  padding: 0 4px;
`;

const AddBtn = styled.button`
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: none;
  background: #007AFF;
  color: #fff;
  font-size: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.12s;
  line-height: 1;

  &:hover {
    background: #0066DD;
  }
`;

const SettingGroup = styled.div`
  background: var(--opt-bg-card);
  border-radius: 12px;
  border: 0.5px solid var(--opt-border-subtle);
  overflow: hidden;
  margin-bottom: 8px;
`;

const SettingRow = styled.div<{ $last?: boolean; $clickable?: boolean }>`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: var(--opt-bg-card);
  border-bottom: ${({ $last }) => ($last ? 'none' : '0.5px solid var(--opt-border-divider)')};
  gap: 12px;
  transition: background 0.12s ease;
  cursor: ${({ $clickable }) => ($clickable ? 'pointer' : 'default')};

  &:hover {
    background: ${({ $clickable }) =>
      $clickable ? 'var(--opt-hover-clickable)' : 'var(--opt-hover-default)'};
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
  color: var(--opt-text-primary);
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

const EmptyState = styled.div`
  padding: 32px 16px;
  text-align: center;
  color: #8E8E93;
  font-size: 14px;
`;

/* ── Component ── */

type TabKey = 'models' | 'prompts';

const AIAndTranslation: React.FC = () => {
  const { t } = useI18n();

  const [activeTab, setActiveTab] = useState<TabKey>('models');
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
    <PageShell route={OptionsRoute.AI_TRANSLATION} subtitle={t('tab_ai_translation_desc')} width={PageWidth.WIDE}>

      {/* ── Segmented Control ── */}
      <SegmentBar>
        <SegmentTrack>
          <SegBtn $active={activeTab === 'models'} onClick={() => setActiveTab('models')}>
            <AppstoreOutlined />
            {t('tab_ai_models')}
          </SegBtn>
          <SegBtn $active={activeTab === 'prompts'} onClick={() => setActiveTab('prompts')}>
            <RobotOutlined />
            {t('tab_ai_prompts')}
          </SegBtn>
        </SegmentTrack>
      </SegmentBar>

      {/* ── Tab: AI Model Services ── */}
      {activeTab === 'models' && (
        <ModelsCard>
          <AISettings hideHeader />
        </ModelsCard>
      )}

      {/* ── Tab: Custom Prompts ── */}
      {activeTab === 'prompts' && (
        <TabPane>
          <PromptsPane>
            <PaneSectionHeader>
              <SectionLabel>{t('custom_prompts')}</SectionLabel>
              <AddBtn onClick={openAddPrompt} title={t('add_prompt') || 'Add prompt'}>
                <PlusOutlined style={{ fontSize: 13 }} />
              </AddBtn>
            </PaneSectionHeader>

            {customPrompts.length === 0 ? (
              <SettingGroup>
                <EmptyState>{t('custom_prompts_empty') || 'No prompts yet. Click + to add one.'}</EmptyState>
              </SettingGroup>
            ) : (
              <SettingGroup>
                {customPrompts.map((prompt, idx) => (
                  <SettingRow
                    key={prompt.id}
                    $last={idx === customPrompts.length - 1}
                    $clickable
                    onClick={() => openEditPrompt(prompt)}
                  >
                    <IconSquircle $color="#5E5CE6">
                      <RobotOutlined />
                    </IconSquircle>
                    <RowContent>
                      <RowTitle>{prompt.title}</RowTitle>
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
            )}
            <SectionFooter>{t('custom_prompts_desc')}</SectionFooter>
          </PromptsPane>
        </TabPane>
      )}

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
            <div style={{ marginBottom: 4, fontSize: 14, color: 'var(--opt-text-primary)' }}>
              {t('prompt_title') || 'Title'}
            </div>
            <Input
              value={promptTitle}
              onChange={(e) => setPromptTitle(e.target.value)}
              placeholder={t('prompt_title_placeholder') || 'Enter prompt title'}
            />
          </div>
          <div>
            <div style={{ marginBottom: 4, fontSize: 14, color: 'var(--opt-text-primary)' }}>
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
    </PageShell>
  );
};

export default AIAndTranslation;
