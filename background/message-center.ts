import dayjs, { Dayjs } from "dayjs";

import { StorageFactory } from "~background/data-persistence/storage-factory";
import { handleSyncRequest } from './sync-manager';
import { broadcastLanguageChange } from './utils/language-utils';

import type { Transcript } from "../hooks/useTranscripts";
import type { StorageProvider } from './data-persistence/types';

/**
 * 消息类型 - 使用 discriminated union 确保各 action 的参数类型安全
 */
/** What to do with a day the file and this device both have. */
export type ImportMode = 'merge' | 'replace';

export type MessageData =
    | { action: 'clear' }
    | { action: 'addOrUpdateRecords'; data: Transcript }
    | { action: 'get-transcripts'; date: Dayjs | number | string }
    | { action: 'delete-records'; date: string }
    | { action: 'restoreRecords'; data: Transcript[]; date?: Dayjs | number | string }
    | { action: 'import-records'; data: Transcript[]; mode: ImportMode }
    | { action: 'get-days-with-messages' }
    | { action: 'openSidePanel' }
    | { action: 'openOptionsPage'; route: string }
    | { action: 'languageChanged'; languageCode: string }
    | { action: 'sync-to-google-drive';[key: string]: unknown }
    | { action: 'update_meeting_info'; data: unknown };

/**
 * 类型安全的消息发送函数
 */
export function sendBackgroundMessage(message: MessageData): void {
    chrome.runtime.sendMessage(message);
}

const HANDLED_ACTIONS = new Set<MessageData['action']>([
    'clear',
    'addOrUpdateRecords',
    'restoreRecords',
    'import-records',
    'get-transcripts',
    'delete-records',
    'get-days-with-messages',
    'openSidePanel',
    'openOptionsPage',
    'languageChanged',
    'sync-to-google-drive',
    'update_meeting_info',
]);

export class BackgroundMessageHandler {
    constructor(
        private storage: StorageProvider = StorageFactory.getInstance().getProvider(),
    ) {}

    private async syncTranscripts(record?: Transcript): Promise<void> {
        chrome.runtime.sendMessage({ action: 'transcripts-updated', data: record });
    }

    /**
     * Merge keeps what is here and writes the imported lines by session (the same line is simply updated).
     * Replace swaps each imported day for the file's version of it. Days the file does not mention are left alone,
     * which restoreRecords without a date would not do.
     */
    private async importRecords(records: Transcript[], mode: ImportMode): Promise<void> {
        if (mode === 'replace') {
            const byDay = new Map<string, Transcript[]>();
            for (const record of records) {
                const day = dayjs(record.timestamp).format('YYYY-MM-DD');
                byDay.set(day, [...(byDay.get(day) ?? []), record]);
            }
            for (const [day, dayRecords] of byDay) await this.storage.restoreRecords(dayRecords, dayjs(day));
            return;
        }
        for (const record of records) await this.storage.addOrUpdateRecord(record);
    }

    private async updateDaysWithMessages(): Promise<void> {
        const days = await this.storage.getDaysWithMessages();
        chrome.runtime.sendMessage({ action: 'days-with-messages', data: days });
    }

    private handleOpenSidePanel(sender: chrome.runtime.MessageSender, sendResponse: (data?: unknown) => void): void {
        const open = (tabId: number) => chrome.sidePanel.open({ tabId })
            .then(() => sendResponse({ success: true }))
            .catch((error) => sendResponse({ success: false, error: error?.message }));

        // The requesting tab is the right one, and skipping the tabs.query hop keeps us inside the
        // user-gesture window that sidePanel.open() requires.
        if (sender.tab?.id !== undefined) {
            open(sender.tab.id);
            return;
        }
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tabId = tabs[0]?.id;
            if (tabId !== undefined) {
                open(tabId);
            } else {
                sendResponse({ success: false, error: '未找到活动标签页' });
            }
        });
    }

    async handleMessage(message: MessageData, sender: chrome.runtime.MessageSender, sendResponse: (data?: unknown) => void): Promise<boolean> {
        console.log('background.js', 'handleMessage', message);

        if (!HANDLED_ACTIONS.has(message.action)) {
            return false; // 不处理此消息，让其他监听器处理
        }

        try {
            switch (message.action) {
                // ── 数据持久化相关 ──────────────────────────────────────────
                case 'clear':
                    await this.storage.deleteRecords();
                    await this.syncTranscripts(); // 不传 data → UI 全量拉取
                    await this.updateDaysWithMessages();
                    sendResponse({ success: true });
                    break;

                case 'addOrUpdateRecords':
                    await this.storage.addOrUpdateRecord(message.data);
                    await this.syncTranscripts(message.data); // 增量推送最新记录
                    sendResponse({ success: true });
                    break;

                case 'restoreRecords': {
                    const restoreDate = message.date ? dayjs(message.date) : undefined;
                    await this.storage.restoreRecords(message.data, restoreDate);
                    await this.updateDaysWithMessages();

                    if (restoreDate) {
                        await this.storage.setCurrentDate(restoreDate);
                        await this.syncTranscripts();
                        setTimeout(() => {
                            chrome.runtime.sendMessage({ action: 'jump-to-date', date: restoreDate.valueOf() });
                        }, 500);
                    } else {
                        const records = message.data;
                        if (records.length > 0) {
                            const latestDate = dayjs(records[records.length - 1].timestamp);
                            await this.storage.setCurrentDate(latestDate);
                            await this.syncTranscripts();
                            setTimeout(() => {
                                chrome.runtime.sendMessage({ action: 'jump-to-date', date: latestDate.valueOf() });
                            }, 500);
                        } else {
                            await this.syncTranscripts();
                        }
                    }
                    sendResponse({ success: true });
                    break;
                }

                case 'import-records': {
                    await this.importRecords(message.data, message.mode);
                    await this.updateDaysWithMessages();
                    await this.syncTranscripts();
                    sendResponse({ success: true });
                    break;
                }

                case 'get-transcripts': {
                    const records = await this.storage.getRecords(dayjs(message.date));
                    sendResponse(records);
                    break;
                }

                case 'get-days-with-messages':
                    await this.updateDaysWithMessages();
                    sendResponse({ success: true });
                    break;

                case 'delete-records': {
                    const deleteDate = dayjs(message.date);
                    await this.storage.deleteRecords(deleteDate);
                    await this.syncTranscripts(); // no data → sidepanel reloads to empty
                    await this.updateDaysWithMessages();
                    // Signal all extension contexts (including sidepanel) via storage.
                    // chrome.runtime.sendMessage is fire-and-forget and can miss the sidepanel;
                    // storage.onChanged is guaranteed to be delivered to every open context.
                    chrome.storage.local.set({ _recordsDeletedAt: Date.now(), _recordsDeletedDate: message.date });
                    // Also broadcast via runtime for contexts that prefer messages
                    chrome.runtime.sendMessage({ action: 'records-deleted', date: message.date });
                    sendResponse({ success: true });
                    break;
                }

                // ── 系统消息相关 ──────────────────────────────────────────
                case 'openSidePanel':
                    this.handleOpenSidePanel(sender, sendResponse);
                    break;

                case 'openOptionsPage':
                    chrome.tabs.create({ url: `${chrome.runtime.getURL('options.html')}#${message.route}` });
                    sendResponse({ success: true });
                    break;

                case 'languageChanged':
                    broadcastLanguageChange(message.languageCode);
                    sendResponse({ success: true, action: '' });
                    break;

                case 'sync-to-google-drive':
                    handleSyncRequest(message, sendResponse);
                    break;

                case 'update_meeting_info':
                    if (sender.tab?.id) {
                        chrome.runtime.sendMessage({
                            action: 'internal_meeting_info_updated',
                            tabId: sender.tab.id,
                            data: message.data
                        });
                    }
                    sendResponse({ success: true });
                    break;
            }
        } catch (error) {
            console.error('Error handling message:', error);
            sendResponse({ success: false, error: 'Failed to process request' });
        }
    }
}

export const messageCenter = new BackgroundMessageHandler();

/**
 * 检查消息是否属于后台处理中心负责
 */
function isHandledAction(action: string | undefined): boolean {
    return !!action && HANDLED_ACTIONS.has(action as MessageData['action']);
}

/**
 * 统一消息处理中心初始化
 * 取代原来分散的 initDataPersistence + initMessageHandlers
 */
export function initMessageCenter() {
    console.log('初始化消息处理中心...');

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (isHandledAction(message?.action)) {
            // 这里不使用 await，直接触发异步处理函数
            // 必须同步返回 true 才能保持 sendResponse 通道开启
            messageCenter.handleMessage(message, sender, sendResponse);
            return true;
        }
        // 对于不关心的消息，显式返回 false，释放给其他监听器
        return false;
    });
}

export { initMessageCenter as initDataPersistence };
export default initMessageCenter;
