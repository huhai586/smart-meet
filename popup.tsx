import React, { useEffect, useState } from "react"

import "./all.scss"

import { Switch } from "antd"
import { 
  EyeOutlined, 
  DeleteOutlined, 
  SettingOutlined,
  AudioOutlined 
} from '@ant-design/icons'
import getIsExtensionEnabled from "./utils/get-is-extension-enabled";
import {updateBadgeText} from "./background/set-badge-text";
import getAPIkey from "./utils/getAPIkey";
import openSidePanel from "~utils/open-side-panel";

const ContentMonitor = () => {
  const [switchValue, setSwitchValue] = useState(true)

    useEffect(() => {
        getIsExtensionEnabled().then((enabled: boolean) => {
            setSwitchValue(enabled)
        });
    }, []);

  const clear = () => {
    // @ts-ignore
    if (confirm('Are you sure to clear all captions?' )) {
        chrome.storage.local.set({ recordedContents: [] }, () => {})
        chrome.runtime.sendMessage({ action: "clear" })
    }
  }

  const handleSetting = () => {
    chrome.runtime.openOptionsPage()
  }

  const toggleSwitch = (v) => {
        setSwitchValue(v)
        chrome.storage.local.set({ isExtensionEnabled: v }, () => {
            console.log('isExtensionEnabled is set to ' + v);
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
      <div className="content-monitor">
        <div className="extension-title"></div>

          <div className={'flex-container'}>
              <span><AudioOutlined style={{ marginRight: '8px' }} />Log the google meeting captions</span>
              <div>
                  <Switch checkedChildren="on" unCheckedChildren="off" onChange={toggleSwitch} value={switchValue}
                          className={'extension-switch'}/>

              </div>
          </div>

          <div className="flex-column" onClick={openSidePanel}>
              <div className={'height26'}><b><EyeOutlined style={{ marginRight: '8px' }} />Show Captions</b></div>
              <span>open the side panel to show the main view</span>
          </div>

          <div className="flex-column" onClick={clear}>
              <div className={'height26'}><b><DeleteOutlined style={{ marginRight: '8px' }} />Clear captions</b></div>
              <span>all captions will be removed</span>
          </div>

          <div className="flex-column" onClick={handleSetting}>
              <div className={'height26'}><b><SettingOutlined style={{ marginRight: '8px' }} />Settings</b></div>
              <span>config AI, Sync data and so on</span>
          </div>


      </div>
  )
}

export default ContentMonitor
