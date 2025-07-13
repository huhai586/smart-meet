/**
 * 语言工具模块
 * 负责处理语言相关的功能
 */

import { supportedLanguages, getLanguageByCode } from '../../utils/languages';
import type { Language } from '../../utils/languages';

/**
 * 检测浏览器语言并设置插件UI语言
 * @returns Promise<Language> - 设置的语言
 */
export async function detectAndSetBrowserLanguage(): Promise<Language> {
    console.log('开始检测浏览器语言...');
    
    try {
        // 使用Chrome的i18n API获取浏览器语言
        const browserLanguage = chrome.i18n.getUILanguage();
        console.log('浏览器语言:', browserLanguage);
        
        // 获取用户接受的语言列表
        const acceptLanguages = await new Promise<string[]>((resolve) => {
            chrome.i18n.getAcceptLanguages((languages) => {
                resolve(languages);
            });
        });
        console.log('用户接受的语言列表:', acceptLanguages);
        
        // 尝试匹配支持的语言
        const detectedLanguage = findBestMatchLanguage(browserLanguage, acceptLanguages);
        console.log('匹配到的语言:', detectedLanguage);
        
        // 设置UI语言
        await setUILanguage(detectedLanguage);
        
        // 根据语言设置翻译语言偏好
        await setTranslationLanguagePreference(detectedLanguage);
        
        return detectedLanguage;
    } catch (error) {
        console.error('检测浏览器语言时出错:', error);
        // 返回默认语言
        const defaultLang = supportedLanguages.find(lang => lang.code === 'en') || supportedLanguages[0];
        await setUILanguage(defaultLang);
        return defaultLang;
    }
}

/**
 * 查找最佳匹配的语言
 * @param browserLanguage - 浏览器主要语言
 * @param acceptLanguages - 用户接受的语言列表
 * @returns Language - 匹配的语言对象
 */
function findBestMatchLanguage(browserLanguage: string, acceptLanguages: string[]): Language {
    // 所有需要检查的语言代码（按优先级排序）
    const languagesToCheck = [browserLanguage, ...acceptLanguages];
    
    for (const langCode of languagesToCheck) {
        // 标准化语言代码
        const normalizedCode = normalizeLanguageCode(langCode);
        
        // 查找完全匹配
        const exactMatch = supportedLanguages.find(lang => lang.code === normalizedCode);
        if (exactMatch) {
            console.log(`找到完全匹配的语言: ${normalizedCode}`);
            return exactMatch;
        }
        
        // 查找语言族匹配（如 zh-CN -> zh）
        const familyCode = normalizedCode.split('-')[0];
        const familyMatch = supportedLanguages.find(lang => lang.code === familyCode);
        if (familyMatch) {
            console.log(`找到语言族匹配: ${familyCode}`);
            return familyMatch;
        }
    }
    
    // 如果没有匹配，返回英语作为默认
    console.log('没有找到匹配的语言，使用英语作为默认');
    return supportedLanguages.find(lang => lang.code === 'en') || supportedLanguages[0];
}

/**
 * 标准化语言代码
 * @param langCode - 原始语言代码
 * @returns string - 标准化后的语言代码
 */
function normalizeLanguageCode(langCode: string): string {
    // 转换为小写
    let normalized = langCode.toLowerCase();
    
    // 处理特殊情况
    const languageMap: { [key: string]: string } = {
        'zh-cn': 'zh',
        'zh-hans': 'zh',
        'zh-tw': 'zh',
        'zh-hant': 'zh',
        'pt-br': 'pt',
        'pt-pt': 'pt',
        'es-es': 'es',
        'es-mx': 'es',
        'fr-fr': 'fr',
        'fr-ca': 'fr',
        'de-de': 'de',
        'de-at': 'de',
        'it-it': 'it',
        'ru-ru': 'ru',
        'ja-jp': 'ja',
        'ko-kr': 'ko',
        'ar-sa': 'ar',
        'hi-in': 'hi',
        'th-th': 'th',
        'vi-vn': 'vi',
        'fa-ir': 'fa'
    };
    
    return languageMap[normalized] || normalized.split('-')[0];
}

/**
 * 设置UI语言
 * @param language - 要设置的语言
 */
async function setUILanguage(language: Language): Promise<void> {
    return new Promise((resolve) => {
        chrome.storage.sync.set({ 'uiLanguage': language.code }, () => {
            console.log(`UI语言已设置为: ${language.name} (${language.code})`);
            resolve();
        });
    });
}

/**
 * 根据UI语言设置翻译语言偏好
 * @param uiLanguage - UI语言
 */
async function setTranslationLanguagePreference(uiLanguage: Language): Promise<void> {
    // 翻译语言偏好映射
    const translationPreferences: { [key: string]: string } = {
        'zh': 'zh', // 中文界面 -> 翻译为中文
        'en': 'zh', // 英文界面 -> 翻译为中文（因为主要用户群体）
        'ja': 'ja', // 日文界面 -> 翻译为日文
        'ko': 'ko', // 韩文界面 -> 翻译为韩文
        'es': 'es', // 西班牙文界面 -> 翻译为西班牙文
        'fr': 'fr', // 法文界面 -> 翻译为法文
        'de': 'de', // 德文界面 -> 翻译为德文
        'ru': 'ru', // 俄文界面 -> 翻译为俄文
        'pt': 'pt', // 葡萄牙文界面 -> 翻译为葡萄牙文
        'it': 'it', // 意大利文界面 -> 翻译为意大利文
        'ar': 'ar', // 阿拉伯文界面 -> 翻译为阿拉伯文
        'hi': 'hi', // 印地文界面 -> 翻译为印地文
        'th': 'th', // 泰文界面 -> 翻译为泰文
        'vi': 'vi', // 越南文界面 -> 翻译为越南文
        'fa': 'fa'  // 波斯文界面 -> 翻译为波斯文
    };
    
    const preferredTranslationLang = translationPreferences[uiLanguage.code] || 'zh';
    
    return new Promise((resolve) => {
        chrome.storage.sync.set({ 'translationLanguage': preferredTranslationLang }, () => {
            console.log(`翻译语言偏好已设置为: ${preferredTranslationLang}`);
            resolve();
        });
    });
}

/**
 * 将语言变更广播给所有组件
 */
export function broadcastLanguageChange(languageCode: string): void {
    console.log('广播语言变更:', languageCode);
    
    // 获取所有打开的标签页
    chrome.tabs.query({}, function(tabs) {
        // 向所有标签页发送消息
        tabs.forEach(tab => {
            if (tab.id) {
                try {
                    chrome.tabs.sendMessage(tab.id, {
                        action: 'languageChanged',
                        languageCode: languageCode
                    });
                } catch (error) {
                    // 忽略无法发送消息的错误（例如，标签页不接受消息）
                    console.log(`向标签页 ${tab.id} 发送消息时出错:`, error);
                }
            }
        });
        
        // 向其他组件发送消息
        try {
            chrome.runtime.sendMessage({
                action: 'languageChanged',
                languageCode: languageCode
            });
        } catch (error) {
            // 忽略无法发送消息的错误
            console.log('广播语言变更时出错:', error);
        }
    });
} 