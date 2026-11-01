import React from 'react';
import { QuestionCircleOutlined, BulbOutlined, BulbFilled, MessageOutlined } from '@ant-design/icons';
import useI18n from '~utils/i18n';
import googleMeetIcon from '~images/google-meeting-icon.png';
import { useDarkMode } from '~hooks/useDarkMode';
import { FeedbackSource, getFeedbackUrl } from '~utils/feedback';
import '~styles/options-header.scss';

interface OptionsHeaderProps {
  onNavigate?: (key: string) => void;
}

const OptionsHeader: React.FC<OptionsHeaderProps> = ({ onNavigate }) => {
  const { t } = useI18n();
  const { isDark, toggle } = useDarkMode();

  const handleHelpCenter = () => {
    if (onNavigate) {
      onNavigate('welcome');
    } else {
      window.location.hash = 'welcome';
    }
  };

  const handleFeedback = async () => {
    chrome.tabs.create({ url: await getFeedbackUrl(FeedbackSource.OPTIONS) });
  };

  return (
    <div className="options-header">
      <div className="header-left">
        <img
          src={googleMeetIcon}
          alt="Smart Meet"
          className="header-icon"
        />
        <div className="header-text">
          <h1 className="header-title">Smart Meet</h1>
          <p className="header-subtitle">{t('app_subtitle')}</p>
        </div>
      </div>
      <div className="header-right">
        <button className="header-action-btn" onClick={handleHelpCenter}>
          <QuestionCircleOutlined />
          <span>{t('help_center')}</span>
        </button>
        <button className="header-action-btn" onClick={handleFeedback}>
          <MessageOutlined />
          <span>{t('feedback_button')}</span>
        </button>
        <button className="header-icon-btn" onClick={toggle} aria-label={isDark ? t('switch_to_light_mode') : t('switch_to_dark_mode')}>
          {isDark ? <BulbFilled /> : <BulbOutlined />}
        </button>
      </div>
    </div>
  );
};

export default OptionsHeader;
