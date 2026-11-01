import React from "react"
import { LayoutOutlined, SettingOutlined } from "@ant-design/icons"
import googleMeetIcon from "~images/google-meet-logo-main-icon.png"
import openSidePanel from "~utils/open-side-panel"
import useI18n from "~/utils/i18n"
import { OptionsRoute, openOptions } from "~/utils/options-routes"

/** The two places people go from the popup are always one click away, with words on them. */
const PopupHeader: React.FC = () => {
  const { t } = useI18n()

  const handleOpenSidePanel = async () => {
    try {
      await openSidePanel()
    } finally {
      window.close()
    }
  }

  const handleOpenSettings = () => {
    openOptions(OptionsRoute.GENERAL)
    window.close()
  }

  return (
    <header className="pm-header">
      <img src={googleMeetIcon} className="pm-header__logo" alt="" />
      <div className="pm-header__title">Smart Meet</div>
      <button className="pm-btn pm-btn--accent pm-btn--sm" onClick={handleOpenSidePanel}>
        <LayoutOutlined /> {t("popup_sidepanel")}
      </button>
      <button
        className="pm-btn pm-btn--sm pm-btn--icon"
        onClick={handleOpenSettings}
        title={t("popup_settings")}
        aria-label={t("popup_settings")}
      >
        <SettingOutlined />
      </button>
    </header>
  )
}

export default PopupHeader
