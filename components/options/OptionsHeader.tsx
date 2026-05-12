import React from 'react';
import { QuestionCircleOutlined, BulbOutlined } from '@ant-design/icons';
import useI18n from '~utils/i18n';
import googleMeetIcon from '~images/google-meeting-icon.png';
import '~styles/options-header.scss';

interface OptionsHeaderProps {
  onNavigate?: (key: string) => void;
}

const OptionsHeader: React.FC<OptionsHeaderProps> = ({ onNavigate }) => {
  const { t } = useI18n();

  const handleHelpCenter = () => {
    if (onNavigate) {
      onNavigate('welcome');
    } else {
      window.location.hash = 'welcome';
    }
  };

  return (
    <div className="options-header">
      <div className="header-left">
        <img
          src={googleMeetIcon}
          alt="Google Meet Caption Pro"
          className="header-icon"
        />
        <div className="header-text">
          <h1 className="header-title">Google Meet Caption Pro</h1>
          <p className="header-subtitle">{t('app_subtitle')}</p>
        </div>
      </div>
      <div className="header-right">
        <button className="header-action-btn" onClick={handleHelpCenter}>
          <QuestionCircleOutlined />
          <span>{t('help_center')}</span>
        </button>
        <button className="header-icon-btn">
          <BulbOutlined />
        </button>
      </div>
    </div>
  );
};

export default OptionsHeader;
