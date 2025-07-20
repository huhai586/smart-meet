import dayjs, { Dayjs } from "dayjs";



import { StorageFactory } from "~background/data-persistence/storage-factory";



import type { Transcript } from "../hooks/useTranscripts";


interface MessageData {
    type?: string;
    action: 'clear' | 'get-transcripts-only' | 'addOrUpdateRecords' | 'get-transcripts' | 'restoreRecords' | 'get-days-with-messages' | 'set-current-date';
    data?: Transcript | Transcript[];
    date?: Dayjs | number | string;
}

class BackgroundMessageHandler {
    private storage = StorageFactory.getInstance().getProvider();

    private async getTranscripts(date?: Dayjs) {
      return await this.storage.getRecords(date)
    }

    private async syncTranscripts(date?: Dayjs): Promise<void> {
        const records = await this.getTranscripts(date);
        console.log('background.js', 'syncTranscripts', records)
        chrome.runtime.sendMessage({
            action: 'refresh-transcripts',
            data: records
        });
    }

    async handleMessage(message: MessageData): Promise<Transcript[]> {
        console.log('background.js', 'handleMessage', message)
        try {
            switch (message.action) {
                case 'clear':
                    await this.storage.deleteRecords();
                    await this.syncTranscripts();
                    await this.updateDaysWithMessages();
                    break;

                case 'addOrUpdateRecords':
                    await this.storage.addOrUpdateRecord(message.data as Transcript);
                    await this.syncTranscripts();
                    break;

                case 'restoreRecords':
                    // 检查是否有指定日期
                    const restoreDate = message.date ? dayjs(message.date) : undefined;
                    await this.storage.restoreRecords(message.data as Transcript[], restoreDate);
                    await this.updateDaysWithMessages();

                    if (restoreDate) {
                        // 如果有指定日期，使用该日期
                        await this.storage.setCurrentDate(restoreDate);
                        await this.syncTranscripts(restoreDate);
                        // 延迟发送跳转消息，确保前端已经准备好
                        setTimeout(() => {
                            console.log('Sending jump-to-date message for specified date:', restoreDate.valueOf());
                            chrome.runtime.sendMessage({
                                action: 'jump-to-date',
                                date: restoreDate.valueOf()
                            });
                        }, 500); // 添加500ms延迟
                    } else {
                        // 没有指定日期时，使用最新记录的日期
                        const records = message.data as Transcript[];
                        if (records.length > 0) {
                            const latestRecord = records[records.length - 1];
                            const latestDate = dayjs(latestRecord.timestamp);
                            await this.storage.setCurrentDate(latestDate);
                            await this.syncTranscripts(latestDate);
                            // 延迟发送跳转消息，确保前端已经准备好
                            setTimeout(() => {
                                console.log('Sending jump-to-date message for latest record:', latestDate.valueOf());
                                chrome.runtime.sendMessage({
                                    action: 'jump-to-date',
                                    date: latestDate.valueOf()
                                });
                            }, 500); // 添加500ms延迟
                        } else {
                            await this.syncTranscripts();
                        }
                    }
                    break;

                case 'get-transcripts':
                    const transcriptDate = message.date ? dayjs(message.date) : undefined;
                    await this.syncTranscripts(transcriptDate);
                    return;

                case 'get-transcripts-only':
                    const date = message.date ? dayjs(message.date) : undefined
                    return await this.getTranscripts(date);

                case 'get-days-with-messages':
                    await this.updateDaysWithMessages();
                    return;

                case 'set-current-date':
                    if (message.date) {
                        await this.storage.setCurrentDate(dayjs(message.date));
                        await this.syncTranscripts(dayjs(message.date));
                    }
                    return;
            }

        } catch (error) {
            console.error('Error handling message:', error);
            chrome.runtime.sendMessage({
                action: 'error',
                error: 'Failed to process request'
            });
        }
    }

    private async updateDaysWithMessages(): Promise<void> {
        const days = await this.storage.getDaysWithMessages();
        chrome.runtime.sendMessage({
            action: 'days-with-messages',
            data: days
        });
    }
}

export const messageCenter = new BackgroundMessageHandler();

/**
 * 数据持久化模块
 * 负责初始化数据持久化相关功能
 */
export function initDataPersistence() {
    console.log('初始化数据持久化...');

    // 设置消息监听器
    chrome.runtime.onMessage.addListener((message) => {
        messageCenter.handleMessage(message).catch(console.error);
        return true; // 保持消息通道开放
    });

    // 在这里添加数据持久化相关的初始化代码
    // 例如：设置存储监听器、初始化默认值等
}

// 为了向后兼容保留别名
const initialDataPersistence = initDataPersistence;
export default initialDataPersistence;
