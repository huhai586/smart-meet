import React, { useState } from 'react';
import {
  ExportOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { DatePicker, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import styled from 'styled-components';
import { useI18n } from '~/utils/i18n';
import Calendar from '~/components/options/Calendar';
import AIChatPanel from '~/components/options/ai-chat/AIChatPanel';
import '~/components/options/ai-chat/ai-chat.scss';
import messageManager from '~/utils/message-manager';
import getMeetingCaptions from '~/utils/getCaptions';
import saveChatLogAsTxt from '~/utils/save';
import { createJsonFile, downloadFile } from '~/utils/file-utils';
import { Modal, Select } from 'antd';

/* ── Types ── */
type Tab = 'history' | 'chat';

/* ── Styled Components ── */

const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 80px);
  max-height: 900px;
  min-height: 560px;
  font-family: -apple-system, 'SF Pro Text', 'Helvetica Neue', 'Inter', sans-serif;
  background: #F2F2F7;
  border-radius: 16px;
  overflow: hidden;
  margin: -4px -4px 0;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
`;

/* Top navigation bar */
const NavBar = styled.div`
  display: flex;
  align-items: center;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 0.5px solid rgba(60, 60, 67, 0.12);
  flex-shrink: 0;
  gap: 12px;
`;

const NavTitle = styled.div`
  flex: 1;
  font-size: 15px;
  font-weight: 600;
  color: #1C1C1E;
  text-align: center;
`;

/* Segment control */
const SegmentWrap = styled.div`
  display: flex;
  background: #E5E5EA;
  border-radius: 9px;
  padding: 2px;
  gap: 0;
`;

const SegBtn = styled.button<{ $active: boolean }>`
  padding: 5px 16px;
  border: none;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, box-shadow 0.15s;
  font-family: -apple-system, 'SF Pro Text', BlinkMacSystemFont, sans-serif;
  background: ${({ $active }) => ($active ? '#FFFFFF' : 'transparent')};
  color: ${({ $active }) => ($active ? '#1C1C1E' : '#3C3C43')};
  box-shadow: ${({ $active }) => ($active ? '0 1px 3px rgba(0,0,0,0.12)' : 'none')};

  &:hover:not([style*="background:#FFFFFF"]) {
    color: #1C1C1E;
  }
`;

/* Action icon button (export) */
const NavActionBtn = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #007AFF;
  font-size: 16px;
  transition: background 0.12s;
  flex-shrink: 0;

  &:hover {
    background: rgba(0, 122, 255, 0.1);
  }
`;

/* Content area - scrollable */
const ContentArea = styled.div<{ $hidden?: boolean }>`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
  display: ${({ $hidden }) => ($hidden ? 'none' : 'flex')};
  flex-direction: column;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: #C7C7CC; border-radius: 2px; }
`;

/* Chat area - not scrollable at this level (inner handles scroll) */
const ChatArea = styled.div<{ $hidden?: boolean }>`
  flex: 1;
  min-height: 0;
  display: ${({ $hidden }) => ($hidden ? 'none' : 'flex')};
  flex-direction: column;
  overflow: hidden;
`;

/* ── Component ── */

const HistoryRecords: React.FC = () => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<Tab>('history');

  /* Export state */
  const [exportDate, setExportDate] = useState<Dayjs>(dayjs());
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [meetingNames, setMeetingNames] = useState<string[]>([]);
  const [selectedExportMeeting, setSelectedExportMeeting] = useState('');
  const [pendingExportFormat, setPendingExportFormat] = useState<'txt' | 'json'>('txt');

  const doExport = (
    meetingName: string,
    transcripts: {
      meetingName: string;
      timestamp: string | number;
      talkContent: string;
      activeSpeaker: string;
    }[],
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
            .filter(
              (tr) =>
                dayjs(tr.timestamp).format('YYYY-MM-DD') === exportDate.format('YYYY-MM-DD'),
            )
            .map((tr) => tr.meetingName || '')
            .filter((n) => n.trim()),
        ),
      );
      if (!names.length) {
        messageManager.warning(
          t('no_meeting_data_for_export') || 'No meeting data available',
        );
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

  const exportMenuItems: MenuProps['items'] = [
    {
      key: 'date',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 0' }}>
          <span style={{ color: '#3C3C43', fontSize: 14 }}>{t('select_date') || 'Export Date'}</span>
          <DatePicker
            value={exportDate}
            onChange={(date) => date && setExportDate(date)}
            format="M/D"
            variant="borderless"
            size="small"
            style={{ color: '#8E8E93', width: 80 }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ),
    },
    { type: 'divider' },
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

  const navTitle = activeTab === 'history' ? t('tab_history') : t('tab_ai_translation');

  return (
    <PageWrapper>
      {/* ── Top navigation bar ── */}
      <NavBar>
        {/* Segment control – centered */}
        <SegmentWrap>
          <SegBtn $active={activeTab === 'history'} onClick={() => setActiveTab('history')}>
            {t('meeting_history_tab') || '会议记录'}
          </SegBtn>
          <SegBtn $active={activeTab === 'chat'} onClick={() => setActiveTab('chat')}>
            {t('ai_assistant_tab')}
          </SegBtn>
        </SegmentWrap>

        <NavTitle style={{ display: 'none' }}>{navTitle}</NavTitle>

        {/* Export action menu */}
        <Dropdown
          menu={{ items: exportMenuItems }}
          trigger={['click']}
          placement="bottomRight"
        >
          <NavActionBtn title={t('export_captions_text')}>
            <ExportOutlined />
          </NavActionBtn>
        </Dropdown>
      </NavBar>

      {/* ── History tab content (scrollable) ── */}
      <ContentArea $hidden={activeTab !== 'history'}>
        <Calendar />
      </ContentArea>

      {/* ── AI Chat tab content (fixed, inner scroll) ── */}
      <ChatArea $hidden={activeTab !== 'chat'}>
        <AIChatPanel />
      </ChatArea>

      {/* Meeting selection modal */}
      <Modal
        title={t('select_meeting_to_export')}
        open={isExportModalOpen}
        onOk={handleExportConfirm}
        onCancel={() => setIsExportModalOpen(false)}
        okText={t('export')}
        cancelText={t('cancel')}
        centered
      >
        <p>{t('select_meeting_desc')}</p>
        <Select
          value={selectedExportMeeting}
          onChange={setSelectedExportMeeting}
          style={{ width: '100%' }}
        >
          {meetingNames.map((name) => (
            <Select.Option key={name} value={name}>
              {name}
            </Select.Option>
          ))}
        </Select>
      </Modal>
    </PageWrapper>
  );
};

export default HistoryRecords;
