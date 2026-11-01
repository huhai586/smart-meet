import React from "react"
import { Select, Switch } from "antd"
import useI18n from "~/utils/i18n"
import useTranslationLanguage from "~/hooks/useTranslationLanguage"
import { useAutoTranslate } from "~/hooks/useAutoTranslate"
import useCaptionWordTranslateToggle from "~/hooks/useCaptionWordTranslateToggle"
import { supportedLanguages, getLanguageDisplay } from "~/utils/languages"

/** The few settings people change during a meeting; everything else is on the settings page. */
const QuickSettings: React.FC = () => {
  const { t } = useI18n()
  const [language, setLanguage] = useTranslationLanguage()
  const [autoTranslate, setAutoTranslate] = useAutoTranslate()
  const [wordTranslate, setWordTranslate] = useCaptionWordTranslateToggle()

  return (
    <section className="pm-section">
      <div className="pm-label">{t("popup_quick_settings")}</div>
      <div className="pm-group">
        <div className="pm-row">
          <span className="pm-row__text">{t("translation_target_language")}</span>
          <Select
            size="small"
            variant="borderless"
            value={language.code}
            popupMatchSelectWidth={false}
            onChange={(code) => {
              const selected = supportedLanguages.find((l) => l.code === code)
              if (selected) setLanguage(selected)
            }}
            options={supportedLanguages.map((l) => ({ value: l.code, label: getLanguageDisplay(l) }))}
          />
        </div>
        <div className="pm-row">
          <span className="pm-row__text">{t("auto_translate")}</span>
          <Switch size="small" checked={autoTranslate} onChange={setAutoTranslate} />
        </div>
        <div className="pm-row">
          <span className="pm-row__text">{t("caption_word_translate")}</span>
          <Switch size="small" checked={wordTranslate} onChange={setWordTranslate} />
        </div>
      </div>
    </section>
  )
}

export default QuickSettings
