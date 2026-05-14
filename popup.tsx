import React, { useState } from "react"
import "./styles/popup.scss"
import PopupHeader from "~/components/popup/PopupHeader"
import TabBar from "~/components/popup/TabBar"
import MeetingsTab from "~/components/popup/tabs/MeetingsTab"
import LiveTab from "~/components/popup/tabs/LiveTab"
import AITab from "~/components/popup/tabs/AITab"
import SettingsTab from "~/components/popup/tabs/SettingsTab"
import type { Tab } from "~/components/popup/types"

const Popup: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("live")

  return (
    <div className="popup-root">
      <PopupHeader />
      <TabBar active={activeTab} onChange={setActiveTab} />
      <div className="popup-body">
        {activeTab === "meetings" && <MeetingsTab />}
        {activeTab === "live" && <LiveTab />}
        {activeTab === "ai" && <AITab />}
        {activeTab === "settings" && <SettingsTab />}
      </div>
    </div>
  )
}

export default Popup
