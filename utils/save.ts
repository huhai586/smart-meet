import { createTextFile, downloadFile } from './file-utils';

function saveChatLogAsTxt(chatLog: string, filename = 'chat_log.txt') {
    // 创建文本文件
    const file = createTextFile(chatLog, filename);
    
    // 下载文件
    downloadFile(file);
}

export default saveChatLogAsTxt
