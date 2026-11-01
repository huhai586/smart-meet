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
import RecordsBrowser from '~/components/options/history/RecordsBrowser';
import AIChatPanel from '~/components/options/ai-chat/AIChatPanel';
import '~/components/options/ai-chat/ai-chat.scss';
import messageManager from '~/utils/message-manager';
import getMeetingCaptions from '~/utils/getCaptions';
import saveChatLogAsTxt from '~/utils/save';
import { createJsonFile, downloadFile } from '~/utils/file-utils';
import { Modal, Select } from 'antd';
import PageShell, { PageWidth } from '~components/options/PageShell';
import { OptionsRoute } from '~utils/options-routes';

/* ── Types ── */
type Tab = 'history' | 'chat';

/* ── Styled Components ── */

/* The records / AI assistant switch and the export button, on the page itself */
const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
`;

const Segments = styled.div`
  display: inline-flex;
  padding: 2px;
  border-radius: 10px;
  background: var(--opt-segment-bg);
`;

const Segment = styled.button<{ $active: boolean }>`
  padding: 6px 20px;
  border: none;
  border-radius: 8px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  color: ${({ $active }) => ($active ? 'var(--opt-segment-text-on)' : 'var(--opt-segment-text-off)')};
  background: ${({ $active }) => ($active ? 'var(--opt-segment-active)' : 'transparent')};
  box-shadow: ${({ $active }) => ($active ? '0 1px 3px rgba(0, 0, 0, 0.12)' : 'none')};
  transition: background 0.18s ease, color 0.18s ease, box-shadow 0.18s ease;
`;

const ExportButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 14px;
  border: none;
  border-radius: 15px;
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--opt-text-primary);
  background: var(--opt-segment-bg);
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;

  &:active {
    transform: scale(0.97);
  }
`;

/* The AI assistant fills a card of its own, scrolling inside */
const AssistantCard = styled.div`
  height: calc(100vh - 290px);
  min-height: 460px;
  max-height: 820px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 14px;
  background: var(--opt-bg-card);
  border: 0.5px solid var(--opt-border-subtle);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
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

  return (
    <PageShell route={OptionsRoute.HISTORY} subtitle={t('tab_history_desc')} width={PageWidth.WIDE}>
      <Toolbar>
        <Segments>
          <Segment $active={activeTab === 'history'} onClick={() => setActiveTab('history')}>
            {t('meeting_history_tab') || '会议记录'}
          </Segment>
          <Segment $active={activeTab === 'chat'} onClick={() => setActiveTab('chat')}>
            {t('ai_assistant_tab')}
          </Segment>
        </Segments>

        <Dropdown menu={{ items: exportMenuItems }} trigger={['click']} placement="bottomRight">
          <ExportButton title={t('export_captions_text')}>
            <ExportOutlined /> {t('export')}
          </ExportButton>
        </Dropdown>
      </Toolbar>

      {activeTab === 'history' ? (
        <RecordsBrowser />
      ) : (
        <AssistantCard>
          <AIChatPanel />
        </AssistantCard>
      )}

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
    </PageShell>
  );
};

export default HistoryRecords;
