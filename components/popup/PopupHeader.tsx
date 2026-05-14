import React from "react"
import googleMeetIcon from "~images/google-meet-logo-main-icon.png"

const PopupHeader: React.FC = () => (
  <div className="ph-header">
    <div className="ph-header__left">
      <img src={googleMeetIcon} className="ph-header__logo" alt="Google Meet" />
      <div className="ph-header__title">Google Meet Caption Pro</div>
    </div>
    <button
      className="ph-header__menu"
      onClick={() => chrome.runtime.openOptionsPage()}
      aria-label="Settings"
    >
      ⋮
    </button>
  </div>
)

export default PopupHeader
