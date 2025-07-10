import React, { useEffect, useState } from "react"

import "./styles/popup.scss"

import { Switch } from "antd"
import {
  EyeOutlined,
  SettingOutlined,
  AudioOutlined,
  TranslationOutlined,
} from '@ant-design/icons'
import getIsExtensionDisabled from "./utils/get-is-extension-disabled";
import {updateBadgeText} from "./background/set-badge-text";
import getAPIkey from "./utils/getAPIkey";
import openSidePanel from "~utils/open-side-panel";
import useI18n from "./utils/i18n";
import { useAutoTranslate } from "./hooks/useAutoTranslate";

const ContentMonitor = () => {
  const [switchValue, setSwitchValue] = useState(true)
  const { t, langCode } = useI18n();
  const [autoTranslateEnabled, setAutoTranslateEnabled] = useAutoTranslate();

  // 调试信息
  useEffect(() => {
    console.log('Current language code:', langCode);
    console.log('Extension name translation:', t('extension_name'));
    console.log('Popup subtitle translation:', t('popup_subtitle'));
  }, [langCode, t]);

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
        // 移除会导致popup关闭的API key检查
        // getAPIkey().catch(() => {
        //     // no API key
        //     chrome.runtime.openOptionsPage();
        // })
  }
  return (
      <div className="content-monitor popup-container">
          {/* 页面标题 */}
          <div className="popup-header">
              <div className="header-icon google-meet-logo">
              </div>
              <div className="header-content">
                  <h3>{t('extension_name')}</h3>
                  <span>{t('popup_subtitle')}</span>
              </div>
          </div>

          {/* 总体开关区域 */}
          <div className="switches-section">
              <div className="section-title">{t('main_controls')}</div>
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

              <div className={'flex-container'}>
                  <span><TranslationOutlined style={{ marginRight: '8px' }} />{t('auto_translate')}</span>
                  <div>
                      <Switch
                        checkedChildren={t('on')}
                        unCheckedChildren={t('off')}
                        onChange={setAutoTranslateEnabled}
                        value={autoTranslateEnabled}
                        style={{ backgroundColor: autoTranslateEnabled ? '#1a73e8' : '' }}
                      />
                  </div>
              </div>
          </div>

          {/* 功能项区域 */}
          <div className="actions-section">
              <div className="section-title">{t('quick_actions')}</div>
              
              <div className="flex-column" onClick={openSidePanel}>
                  <div className={'height26'}><b><EyeOutlined style={{ marginRight: '8px' }} />{t('show_captions')}</b></div>
                  <span>{t('show_captions_desc')}</span>
              </div>

              <div className="flex-column" onClick={handleSetting}>
                  <div className={'height26'}><b><SettingOutlined style={{ marginRight: '8px' }} />{t('settings')}</b></div>
                  <span>{t('settings_desc')}</span>
              </div>
          </div>
      </div>
  )
}

export default ContentMonitor
