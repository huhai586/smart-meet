import React from "react"
import { Select, Switch } from "antd"
import { ArrowRightOutlined } from "@ant-design/icons"
import useI18n from "~/utils/i18n"
import useTranslationLanguage from "~/hooks/useTranslationLanguage"
import { useAutoTranslate } from "~/hooks/useAutoTranslate"
import useCaptionWordTranslateToggle from "~/hooks/useCaptionWordTranslateToggle"
import { supportedLanguages, getLanguageDisplay } from "~/utils/languages"
import { languageNativeName, useMeetingLanguage, useResolvedMeetingLanguage } from "~/hooks/useMeetingLanguage"
import { MEETING_LANGUAGE_AUTO } from "~/utils/meeting-language"

/** The few settings people change during a meeting; everything else is on the settings page. */
const QuickSettings: React.FC = () => {
  const { t } = useI18n()
  const [language, setLanguage] = useTranslationLanguage()
  const [autoTranslate, setAutoTranslate] = useAutoTranslate()
  const [wordTranslate, setWordTranslate] = useCaptionWordTranslateToggle()
  const [meetingLanguage, setMeetingLanguage] = useMeetingLanguage()
  const resolvedMeetingLanguage = useResolvedMeetingLanguage()

  // The popup is narrow: the closed selects show short names, the lists show full ones.
  const meetingLanguageLabel =
    meetingLanguage !== MEETING_LANGUAGE_AUTO
      ? languageNativeName(meetingLanguage)
      : resolvedMeetingLanguage
        ? t("meeting_language_auto_value", { language: languageNativeName(resolvedMeetingLanguage.language) })
        : t("meeting_language_auto")

  return (
    <section className="pm-section">
      <div className="pm-label">{t("popup_quick_settings")}</div>
      <div className="pm-group">
        {/* Meeting language → translate to: the source and the target of every translation */}
        <div className="pm-row">
          <span className="pm-row__text">{t("translation_languages")}</span>
          <Select
            size="small"
            variant="borderless"
            aria-label={t("meeting_language")}
            value={meetingLanguage}
            popupMatchSelectWidth={false}
            onChange={setMeetingLanguage}
            labelRender={() => meetingLanguageLabel}
            options={[
              { value: MEETING_LANGUAGE_AUTO, label: t("meeting_language_auto") },
              ...supportedLanguages.map((l) => ({ value: l.code, label: getLanguageDisplay(l) })),
            ]}
          />
          <ArrowRightOutlined className="pm-row__arrow" aria-hidden />
          <Select
            size="small"
            variant="borderless"
            aria-label={t("translate_to")}
            value={language.code}
            popupMatchSelectWidth={false}
            onChange={(code) => {
              const selected = supportedLanguages.find((l) => l.code === code)
              if (selected) setLanguage(selected)
            }}
            labelRender={() => language.nativeName}
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
