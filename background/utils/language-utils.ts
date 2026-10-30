/**
 * 语言工具模块
 * 负责处理语言相关的功能
 */

import type { Language } from '../../utils/languages';
import {
    findBestMatchLanguage,
    getPreferredTranslationLanguage,
} from '../../utils/language-preferences';

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
        const defaultLang = findBestMatchLanguage('', []);
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
    const preferredTranslationLang = getPreferredTranslationLanguage(uiLanguage.code);
    
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
