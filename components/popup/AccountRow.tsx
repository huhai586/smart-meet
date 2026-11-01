import React from "react"
import useI18n from "~/utils/i18n"
import useGoogleAccount from "~/hooks/useGoogleAccount"

/** Who the popup is signed in as; Calendar and Drive share this one Google account. */
const AccountRow: React.FC = () => {
  const { t } = useI18n()
  const { loading, user } = useGoogleAccount()

  if (loading) return null

  return (
    <div className={`pm-account${user ? " pm-account--in" : ""}`} title={user?.email}>
      <span className="pm-account__dot" />
      <span className="pm-account__text">{user ? user.email : t("google_account_signed_out")}</span>
    </div>
  )
}

export default AccountRow
