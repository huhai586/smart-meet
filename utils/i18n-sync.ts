/**
 * 同步通知的国际化工具
 */

/**
 * 英文文本
 */
const enTexts: Record<string, string> = {
    'sync_notification_no_data_title': 'No Sync Needed',
    'sync_notification_no_data_description': 'No meeting records to sync today',
    'sync_notification_success_title': 'Meeting Records Synced',
    'sync_notification_success_description': 'Successfully synced $1 meeting records to Google Drive',
    'sync_notification_failed_title': 'Sync Failed',
    'sync_notification_failed_description': 'Unable to sync meeting records to Google Drive. This may be due to network issues or lack of authorization. Please try manual sync later',
    'sync_notification_error_title': 'Sync Error',
    'sync_notification_error_description': 'An error occurred during sync: $1',
    'sync_notification_get_data_failed_title': 'Sync Failed',
    'sync_notification_get_data_failed_description': 'Unable to retrieve meeting record data. Please try manual sync later',
};

/**
 * 中文文本
 */
const zhTexts: Record<string, string> = {
    'sync_notification_no_data_title': '无需同步',
    'sync_notification_no_data_description': '当天没有会议记录需要同步',
    'sync_notification_success_title': '会议记录已同步',
    'sync_notification_success_description': '已成功同步 $1 条会议记录到 Google Drive',
    'sync_notification_failed_title': '同步失败',
    'sync_notification_failed_description': '无法同步会议记录到 Google Drive，可能是网络问题或未授权，请稍后手动同步',
    'sync_notification_error_title': '同步出错',
    'sync_notification_error_description': '同步过程中发生错误: $1',
    'sync_notification_get_data_failed_title': '同步失败',
    'sync_notification_get_data_failed_description': '无法获取会议记录数据，请稍后手动同步',
};

/**
 * 所有语言的文本映射
 */
const allTexts: Record<string, Record<string, string>> = {
    'en': enTexts,
    'zh': zhTexts,
};

/**
 * 替换占位符
 */
function replacePlaceholders(text: string, substitutions?: string | string[]): string {
    if (!substitutions) return text;
    
    const subs = Array.isArray(substitutions) ? substitutions : [substitutions];
    let result = text;
    
    subs.forEach((sub, index) => {
        result = result.replace(`$${index + 1}`, sub);
        result = result.replace(new RegExp(`\\$[A-Z]+\\$`, 'g'), sub); // 替换 $COUNT$, $ERROR$ 等
    });
    
    return result;
}

/**
 * 获取用户设置的 UI 语言
 */
async function getUserLanguage(): Promise<string> {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['uiLanguage'], (result) => {
            const lang = result.uiLanguage || 'en';
            console.log('用户设置的 UI 语言:', lang);
            resolve(lang);
        });
    });
}

/**
 * 获取翻译文本（同步版本，使用缓存的语言）
 */
let cachedLanguage: string | null = null;

export function getMessage(key: string, substitutions?: string | string[]): string {
    // 使用缓存的语言或默认英文
    const lang = cachedLanguage || 'en';
    console.log(`i18n getMessage: key="${key}", lang="${lang}"`);
    
    // 获取对应语言的文本
    const texts = allTexts[lang] || allTexts['en'];
    const text = texts[key];
    
    if (text) {
        return replacePlaceholders(text, substitutions);
    } else {
        console.warn(`Translation not found for key: ${key}, lang: ${lang}`);
        return key;
    }
}

/**
 * 异步获取翻译文本（推荐使用）
 */
export async function getMessageAsync(key: string, substitutions?: string | string[]): Promise<string> {
    const lang = await getUserLanguage();
    cachedLanguage = lang; // 更新缓存
    
    const texts = allTexts[lang] || allTexts['en'];
    const text = texts[key];
    
    if (text) {
        return replacePlaceholders(text, substitutions);
    } else {
        console.warn(`Translation not found for key: ${key}, lang: ${lang}`);
        return key;
    }
}

/**
 * 初始化语言缓存
 */
export async function initLanguageCache(): Promise<void> {
    cachedLanguage = await getUserLanguage();
    console.log('语言缓存已初始化:', cachedLanguage);
}

/**
 * 同步通知的翻译键
 */
export const SyncNotificationKeys = {
    // 无需同步
    NO_DATA_TITLE: 'sync_notification_no_data_title',
    NO_DATA_DESCRIPTION: 'sync_notification_no_data_description',
    
    // 同步成功
    SUCCESS_TITLE: 'sync_notification_success_title',
    SUCCESS_DESCRIPTION: 'sync_notification_success_description',
    
    // 同步失败
    FAILED_TITLE: 'sync_notification_failed_title',
    FAILED_DESCRIPTION: 'sync_notification_failed_description',
    
    // 同步出错
    ERROR_TITLE: 'sync_notification_error_title',
    ERROR_DESCRIPTION: 'sync_notification_error_description',
    
    // 获取数据失败
    GET_DATA_FAILED_TITLE: 'sync_notification_get_data_failed_title',
    GET_DATA_FAILED_DESCRIPTION: 'sync_notification_get_data_failed_description',
};

/**
 * 获取同步通知文本（异步版本）
 */
export const getSyncNotificationText = {
    noData: async () => ({
        title: await getMessageAsync(SyncNotificationKeys.NO_DATA_TITLE),
        description: await getMessageAsync(SyncNotificationKeys.NO_DATA_DESCRIPTION),
    }),
    
    success: async (count: number) => ({
        title: await getMessageAsync(SyncNotificationKeys.SUCCESS_TITLE),
        description: await getMessageAsync(SyncNotificationKeys.SUCCESS_DESCRIPTION, String(count)),
    }),
    
    failed: async () => ({
        title: await getMessageAsync(SyncNotificationKeys.FAILED_TITLE),
        description: await getMessageAsync(SyncNotificationKeys.FAILED_DESCRIPTION),
    }),
    
    error: async (errorMessage: string) => ({
        title: await getMessageAsync(SyncNotificationKeys.ERROR_TITLE),
        description: await getMessageAsync(SyncNotificationKeys.ERROR_DESCRIPTION, errorMessage),
    }),
    
    getDataFailed: async () => ({
        title: await getMessageAsync(SyncNotificationKeys.GET_DATA_FAILED_TITLE),
        description: await getMessageAsync(SyncNotificationKeys.GET_DATA_FAILED_DESCRIPTION),
    }),
};
