/**
 * Google Meet captions DOM utilities
 *
 * Localised captions button aria-labels of the classic Meet UI.
 *
 * Do NOT use these to detect or control captions state: controlling captions lives in
 * utils/captions-control, which does not depend on localised text.
 */

/** aria-label values for the "Turn on captions" button across all Google Meet locales */
export const CAPTIONS_ON_BUTTON_LABELS: string[] = [
    'Turn on captions',   // en
    '开启字幕',             // zh-CN
    '開啟字幕',             // zh-TW
    'Activer les sous-titres',  // fr
    'Untertitel aktivieren',    // de
    'Activar subtítulos',       // es
    'Attiva didascalie',        // it
    'Ativar legendas',          // pt
    'Включить субтитры',        // ru
    '자막 사용 설정',            // ko
    '字幕をオンにする',           // ja
    'เปิดใช้งานคำบรรยาย',     // th
    'Bật phụ đề',              // vi
    'تفعيل الترجمة',           // ar
    'کپشن را روشن کنید',       // fa
    'कैप्शन चालू करें',       // hi
];

/** aria-label values for the "Turn OFF captions" button across all Google Meet locales */
export const CAPTIONS_OFF_BUTTON_LABELS: string[] = [
    'Turn off captions',            // en
    '关闭字幕',                       // zh-CN
    '關閉字幕',                       // zh-TW
    'Désactiver les sous-titres',   // fr
    'Untertitel deaktivieren',      // de
    'Desactivar subtítulos',        // es
    'Disattiva didascalie',         // it
    'Desativar legendas',           // pt
    'Отключить субтитры',           // ru
    '자막 사용 중지',                  // ko
    '字幕をオフにする',                 // ja
    'ปิดใช้งานคำบรรยาย',           // th
    'Tắt phụ đề',                  // vi
    'تعطيل الترجمة',               // ar
    'کپشن را خاموش کنید',          // fa
    'कैप्शन बंद करें',             // hi
];

/** Returns true when the current page is a Google Meet meeting page. */
export function isGoogleMeeting(): boolean {
    return window.location.hostname === 'meet.google.com';
}
