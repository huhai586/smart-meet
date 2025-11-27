// 测试 i18n 功能
// 在 Background Service Worker 控制台中运行

console.log('=== 测试 Chrome i18n API ===');

// 测试 1: 检查 API 是否可用
console.log('1. chrome.i18n 可用?', !!chrome.i18n);
console.log('2. chrome.i18n.getMessage 可用?', !!chrome.i18n?.getMessage);

// 测试 2: 获取现有的翻译
console.log('\n=== 测试现有翻译 ===');
const extensionName = chrome.i18n.getMessage('extension_name');
console.log('extension_name:', extensionName);

const extensionDesc = chrome.i18n.getMessage('extension_description');
console.log('extension_description:', extensionDesc);

// 测试 3: 获取同步通知翻译
console.log('\n=== 测试同步通知翻译 ===');
const noDataTitle = chrome.i18n.getMessage('sync_notification_no_data_title');
console.log('sync_notification_no_data_title:', noDataTitle);

const noDataDesc = chrome.i18n.getMessage('sync_notification_no_data_description');
console.log('sync_notification_no_data_description:', noDataDesc);

const successTitle = chrome.i18n.getMessage('sync_notification_success_title');
console.log('sync_notification_success_title:', successTitle);

const successDesc = chrome.i18n.getMessage('sync_notification_success_description', '5');
console.log('sync_notification_success_description (with 5):', successDesc);

// 测试 4: 获取当前语言
console.log('\n=== 当前语言设置 ===');
console.log('UI Language:', chrome.i18n.getUILanguage());

// 测试 5: 列出所有可用的消息键
console.log('\n=== 测试所有同步通知键 ===');
const keys = [
    'sync_notification_no_data_title',
    'sync_notification_no_data_description',
    'sync_notification_success_title',
    'sync_notification_success_description',
    'sync_notification_failed_title',
    'sync_notification_failed_description',
    'sync_notification_error_title',
    'sync_notification_error_description',
    'sync_notification_get_data_failed_title',
    'sync_notification_get_data_failed_description',
];

keys.forEach(key => {
    const value = chrome.i18n.getMessage(key);
    console.log(`${key}: ${value ? '✅' : '❌'} "${value}"`);
});

console.log('\n=== 测试完成 ===');
