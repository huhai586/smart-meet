import React from "react"
import googleMeetIcon from "~images/google-meet-logo-main-icon.png"
import openSidePanel from "~utils/open-side-panel"

const SidePanelIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.8" />
    <rect x="11.2" y="4.8" width="4" height="10.4" rx="1.2" fill="currentColor" />
  </svg>
)

const PopupHeader: React.FC = () => {
  const handleOpenSidePanel = () => {
    openSidePanel()
    window.close()
  }

  return (
    <div className="ph-header">
      <div className="ph-header__left">
        <img src={googleMeetIcon} className="ph-header__logo" alt="Google Meet" />
        <div className="ph-header__title">Smart Meet</div>
      </div>
      <button
        className="ph-header__menu"
        onClick={handleOpenSidePanel}
        aria-label="Open Side Panel"
        title="Open Side Panel"
      >
        <SidePanelIcon />
      </button>
    </div>
  )
}

export default PopupHeader

export default PopupHeader
