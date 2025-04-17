import React, { useEffect, useState } from "react"

import "./all.scss"

import { Switch } from "antd"
import {
  EyeOutlined,
  SettingOutlined,
  AudioOutlined,
} from '@ant-design/icons'
import getIsExtensionDisabled from "./utils/get-is-extension-disabled";
import {updateBadgeText} from "./background/set-badge-text";
import getAPIkey from "./utils/getAPIkey";
import openSidePanel from "~utils/open-side-panel";
import useI18n from "./utils/i18n";

const ContentMonitor = () => {
  const [switchValue, setSwitchValue] = useState(true)
  const { t } = useI18n();

    useEffect(() => {
        getIsExtensionDisabled().then((disabled: boolean) => {
            setSwitchValue(!disabled)
        });
    }, []);

  const handleSetting = () => {
    chrome.runtime.openOptionsPage()
  }

  const toggleSwitch = (v) => {
        setSwitchValue(v)
        chrome.storage.local.set({ isExtensionDisabled: !v }, () => {
            console.log('isExtensionDisabled is set to ' + !v);
            chrome.tabs.query({},function(tabs) {
                tabs.forEach((tab) => {
                    chrome.tabs.sendMessage(tab.id, { action: "toggleSwitch", value: v });
                })
            });
        });
        updateBadgeText();
        getAPIkey().catch(() => {
            // no API key
            chrome.runtime.openOptionsPage();
        })
  }
  return (
      <div className="content-monitor popup-container">
        <div className="extension-title"></div>

          <div className={'flex-container'}>
              <span><AudioOutlined style={{ marginRight: '8px' }} />{t('log_captions')}</span>
              <div>
                  <Switch 
                    checkedChildren={t('on')} 
                    unCheckedChildren={t('off')} 
                    onChange={toggleSwitch} 
                    value={switchValue}
                    style={{ backgroundColor: switchValue ? '#1a73e8' : '' }}
                  />
              </div>
          </div>

          <div className="flex-column" onClick={openSidePanel}>
              <div className={'height26'}><b><EyeOutlined style={{ marginRight: '8px' }} />{t('show_captions')}</b></div>
              <span>{t('show_captions_desc')}</span>
          </div>

          <div className="flex-column" onClick={handleSetting}>
              <div className={'height26'}><b><SettingOutlined style={{ marginRight: '8px' }} />{t('settings')}</b></div>
              <span>{t('settings_desc')}</span>
          </div>
      </div>
  )
}

export default ContentMonitor
