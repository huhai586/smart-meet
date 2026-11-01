import React from "react"
import { ConfigProvider, theme } from "antd"
import { RightOutlined } from "@ant-design/icons"
import "./styles/theme-vars.scss"
import "./styles/popup.scss"
import PopupHeader from "~/components/popup/PopupHeader"
import AccountRow from "~/components/popup/AccountRow"
import MeetingCard from "~/components/popup/MeetingCard"
import QuickSettings from "~/components/popup/QuickSettings"
import useI18n from "~/utils/i18n"
import { OptionsRoute, openOptions } from "~/utils/options-routes"
import { useDarkMode } from "~/hooks/useDarkMode"

const openAndClose = (route: Parameters<typeof openOptions>[0]) => {
  openOptions(route)
  window.close()
}

const Popup: React.FC = () => {
  const { isDark } = useDarkMode()
  const { t } = useI18n()

  return (
    <ConfigProvider theme={{ algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm }}>
      <div className="popup-root">
        <PopupHeader />
        <AccountRow />
        <MeetingCard />
        <QuickSettings />
        <footer className="pm-footer">
          <button onClick={() => openAndClose(OptionsRoute.HISTORY)}>{t("tab_data_sync")}</button>
          <button onClick={() => openAndClose(OptionsRoute.GENERAL)}>
            {t("popup_all_settings")} <RightOutlined />
          </button>
        </footer>
      </div>
    </ConfigProvider>
  )
}

export default Popup
