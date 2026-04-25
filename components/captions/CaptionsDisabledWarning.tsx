import React from 'react';
import './captions-disabled-warning.scss';
import { useI18n } from '../../utils/i18n';

interface CaptionsDisabledWarningProps {
  onDismiss: () => void;
  onReEnable: () => void;
}

const WarningIcon = () => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" className="cdw-icon">
    <path
      d="M12 2L2 19.5h20L12 2z"
      fill="#FF9F0A"
      stroke="#FF9F0A"
      strokeWidth="0.5"
      strokeLinejoin="round"
    />
    <path d="M12 9v5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="12" cy="16.5" r="0.9" fill="#fff" />
  </svg>
);

const CaptionsDisabledWarning: React.FC<CaptionsDisabledWarningProps> = ({ onDismiss, onReEnable }) => {
  const { t } = useI18n();

  return (
    <div className="cdw-backdrop">
      <div className="cdw-card">
        <div className="cdw-header">
          <WarningIcon />
          <span className="cdw-title">{t('captions_disabled_title')}</span>
        </div>

        <p className="cdw-body">
          {t('captions_disabled_body').split('\n').map((line, i) => (
            line ? <React.Fragment key={i}>{line}</React.Fragment> : <br key={i} />
          ))}
        </p>

        <div className="cdw-actions">
          <button className="cdw-btn cdw-btn--primary" onClick={onReEnable}>
            {t('captions_disabled_reenable')}
          </button>
          <button className="cdw-btn cdw-btn--ghost" onClick={onDismiss}>
            {t('captions_disabled_dismiss')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CaptionsDisabledWarning;
