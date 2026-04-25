/**
 * Google Meet captions DOM utilities
 *
 * Shared util for detecting and controlling the Google Meet captions button.
 *
 * Logic:
 *   - If the "Turn on captions" button IS found in the DOM → captions are OFF.
 *   - If the button is NOT found → captions are already ON.
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

/**
 * Returns the "Turn on captions" button element if it exists, otherwise null.
 * If the button exists, captions are currently OFF.
 */
export function getCaptionsToggleButton(): HTMLButtonElement | null {
    for (const label of CAPTIONS_ON_BUTTON_LABELS) {
        const btn = document.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`);
        if (btn) return btn;
    }
    return null;
}

/** Returns true when the current page is a Google Meet meeting page. */
export function isGoogleMeeting(): boolean {
    return window.location.hostname === 'meet.google.com';
}

/**
 * Returns true if Google Meet captions are already enabled.
 * (i.e. the "Turn on captions" button is NOT present in the DOM)
 */
export function isCaptionsEnabled(): boolean {
    return getCaptionsToggleButton() === null;
}

/**
 * Clicks the "Turn on captions" button if captions are currently off.
 * @returns true if the button was found and clicked; false if captions were already on.
 */
export function enableCaptions(): boolean {
    const btn = getCaptionsToggleButton();
    if (btn) {
        btn.click();
        return true;
    }
    return false;
}
