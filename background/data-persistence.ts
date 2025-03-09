import dayjs, { Dayjs } from 'dayjs';
import { StorageFactory } from "~background/data-persistence/storage-factory";
import type { Transcript } from '../hooks/useTranscripts';

interface MessageData {
    type?: string;
    action: 'clear' | 'addOrUpdateRecords' | 'get-transcripts' | 'restoreRecords' | 'get-days-with-messages' | 'set-current-date';
    data?: Transcript | Transcript[];
    date?: Dayjs;
}

class BackgroundMessageHandler {
    private storage = StorageFactory.getInstance().getProvider();

    private async syncTranscripts(date?: Dayjs): Promise<void> {
        const records = await this.storage.getRecords(date);    
        console.log('background.js', 'syncTranscripts', records)
        chrome.runtime.sendMessage({
            action: 'refresh-transcripts',
            data: records
        });
    }

    async handleMessage(message: MessageData): Promise<void> {
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
                    await this.storage.restoreRecords(message.data as Transcript[]);
                    await this.updateDaysWithMessages();
                    await this.syncTranscripts();
                    break;

                case 'get-transcripts':
                    const date = message.date ? dayjs(message.date) : undefined;
                    await this.syncTranscripts(date);
                    return;

                case 'get-days-with-messages':
                    await this.updateDaysWithMessages();
                    return;

                case 'set-current-date':
                    if (message.date) {
                        await this.storage.setCurrentDate(dayjs(message.date));
                        await this.syncTranscripts(message.date);
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


const initialDataPersistence = () => {
    console.log('background.js', 'BackgroundMessageHandler')
    const handler = new BackgroundMessageHandler();
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        handler.handleMessage(message).catch(console.error);
        return true; // 保持消息通道开放
    });
}

export default initialDataPersistence;
