import React, { useState } from 'react';
import { Button, DatePicker, Radio, Segmented, Upload } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import { useI18n } from '~utils/i18n';
import messageManager from '~utils/message-manager';
import { createJsonFile, createTextFile, downloadFile } from '~utils/file-utils';
import getMeetingCaptions from '~utils/getCaptions';
import { getMultiDateTranscripts } from '~utils/getMultiDateTranscripts';
import { buildChatFile, parseChatFile, summarizeImport, toChatText, type ImportSummary } from '~utils/chat-transfer';
import type { Transcript } from '~hooks/useTranscripts';
import type { ImportMode } from '~background/message-center';
import PageShell from '~components/options/PageShell';
import { OptionsRoute } from '~utils/options-routes';
import './data-transfer.scss';

type ExportFormat = 'json' | 'txt';

interface PendingImport {
  fileName: string;
  records: Transcript[];
  skipped: number;
  summary: ImportSummary;
}

const DEFAULT_RANGE: [Dayjs, Dayjs] = [dayjs().subtract(6, 'day'), dayjs()];

/** Moves meeting records in and out of the extension as files; no Google account is involved. */
const DataTransfer: React.FC = () => {
  const { t } = useI18n();

  const [range, setRange] = useState<[Dayjs, Dayjs]>(DEFAULT_RANGE);
  const [format, setFormat] = useState<ExportFormat>('json');
  const [exporting, setExporting] = useState(false);

  const [pending, setPending] = useState<PendingImport | null>(null);
  const [mode, setMode] = useState<ImportMode>('merge');
  const [importing, setImporting] = useState(false);

  const presets = [
    { label: t('transfer_range_today'), value: [dayjs(), dayjs()] as [Dayjs, Dayjs] },
    { label: t('vocab_range_week'), value: [dayjs().subtract(6, 'day'), dayjs()] as [Dayjs, Dayjs] },
    { label: t('vocab_range_month'), value: [dayjs().subtract(29, 'day'), dayjs()] as [Dayjs, Dayjs] },
    { label: t('transfer_range_year'), value: [dayjs().subtract(364, 'day'), dayjs()] as [Dayjs, Dayjs] },
  ];

  const runExport = async () => {
    setExporting(true);
    try {
      const { transcripts } = await getMultiDateTranscripts(range[0], range[1]);
      if (transcripts.length === 0) {
        messageManager.warning(t('transfer_export_empty'));
        return;
      }
      const stamp = dayjs().format('YYYYMMDD');
      downloadFile(
        format === 'json'
          ? createJsonFile(buildChatFile(transcripts, Date.now()), `smart-meet-chat-${stamp}.json`, { pretty: true })
          : createTextFile(toChatText(transcripts), `smart-meet-chat-${stamp}.txt`),
      );
      messageManager.success(t('export_success'));
    } finally {
      setExporting(false);
    }
  };

  const readFile = async (file: File) => {
    const parsed = parseChatFile(await file.text());
    if (parsed.ok === false) {
      messageManager.error(t(parsed.reason === 'not_json' ? 'transfer_error_not_json' : 'transfer_error_no_records'));
      return;
    }
    // Which of these lines are already here: look at each day the file covers.
    const dates = [...new Set(parsed.records.map((record) => dayjs(record.timestamp).format('YYYY-MM-DD')))];
    const local = await Promise.all(dates.map((date) => getMeetingCaptions(dayjs(date))));
    setMode('merge');
    setPending({ fileName: file.name, records: parsed.records, skipped: parsed.skipped, summary: summarizeImport(parsed.records, local.flat()) });
  };

  const confirmImport = async () => {
    if (!pending) return;
    setImporting(true);
    try {
      const response = await chrome.runtime.sendMessage({ action: 'import-records', data: pending.records, mode });
      if (response?.success) {
        messageManager.success(t('transfer_import_done', { total: String(pending.summary.total) }));
        setPending(null);
      } else {
        messageManager.error(t('transfer_import_failed'));
      }
    } catch {
      messageManager.error(t('transfer_import_failed'));
    } finally {
      setImporting(false);
    }
  };

  return (
    <PageShell route={OptionsRoute.DATA_TRANSFER} subtitle={t('transfer_subtitle')}>

      <section className="transfer-section">
        <h2 className="transfer-section__label">{t('transfer_export_title')}</h2>
        <div className="transfer-card transfer-card__controls">
          <DatePicker.RangePicker
            value={range}
            presets={presets}
            allowClear={false}
            disabledDate={(day) => day.isAfter(dayjs(), 'day')}
            onChange={(value) => value?.[0] && value?.[1] && setRange([value[0], value[1]])}
          />
          <Segmented
            value={format}
            onChange={(value) => setFormat(value as ExportFormat)}
            options={[
              { label: t('transfer_format_json'), value: 'json' },
              { label: t('transfer_format_txt'), value: 'txt' },
            ]}
          />
          <Button type="primary" loading={exporting} onClick={runExport}>
            {t('transfer_export_button')}
          </Button>
        </div>
        <p className="transfer-section__note">{t('transfer_export_desc')}</p>
      </section>

      <section className="transfer-section">
        <h2 className="transfer-section__label">{t('transfer_import_title')}</h2>
        <div className="transfer-card">
        {!pending ? (
          <Upload.Dragger
            accept=".json"
            multiple={false}
            showUploadList={false}
            beforeUpload={(file) => {
              void readFile(file);
              return false;
            }}
          >
            <p className="ant-upload-drag-icon"><InboxOutlined /></p>
            <p className="ant-upload-text">{t('transfer_drop_hint')}</p>
          </Upload.Dragger>
        ) : (
          <div className="transfer-preview">
            <div className="transfer-preview__file">{pending.fileName}</div>
            <p className="transfer-preview__summary">
              {t('transfer_preview_summary', {
                total: String(pending.summary.total),
                days: String(pending.summary.days.length),
                new: String(pending.summary.newCount),
              })}
            </p>
            {pending.skipped > 0 && <p className="transfer-preview__note">{t('transfer_preview_skipped', { n: String(pending.skipped) })}</p>}

            <ul className="transfer-preview__days">
              {pending.summary.days.map((day) => (
                <li key={day.date}>
                  <span>{day.date}</span>
                  <span>{t('transfer_day_row', { count: String(day.count), new: String(day.newCount) })}</span>
                </li>
              ))}
            </ul>

            {pending.summary.touchesExistingDays && (
              <Radio.Group className="transfer-preview__mode" value={mode} onChange={(event) => setMode(event.target.value)}>
                <Radio value="merge">
                  <strong>{t('transfer_mode_merge')}</strong>
                  <span>{t('transfer_mode_merge_desc')}</span>
                </Radio>
                <Radio value="replace">
                  <strong>{t('transfer_mode_replace')}</strong>
                  <span>{t('transfer_mode_replace_desc')}</span>
                </Radio>
              </Radio.Group>
            )}

            <div className="transfer-preview__actions">
              <Button onClick={() => setPending(null)} disabled={importing}>{t('cancel')}</Button>
              <Button type="primary" loading={importing} onClick={confirmImport}>{t('transfer_import_confirm')}</Button>
            </div>
          </div>
        )}
        </div>
        <p className="transfer-section__note">{t('transfer_import_desc')}</p>
      </section>
    </PageShell>
  );
};

export default DataTransfer;
