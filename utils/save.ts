function saveChatLogAsTxt(chatLog, filename = 'chat_log.txt') {    const text = chatLog; // 假设 chatLog 是一个包含聊天记录的字符串    // 创建一个包含文本数据的 Blob 对象    const blob = new Blob([text], { type: 'text/plain' });    // 创建一个 URL 对象指向 Blob    const url = URL.createObjectURL(blob);    // 创建一个隐藏的 <a> 标签    const link = document.createElement('a');    link.href = url;    link.download = filename; // 设置下载的文件名    // 将 <a> 标签添加到文档中    document.body.appendChild(link);    // 模拟点击 <a> 标签来启动下载    link.click();    // 清理 URL 对象和 <a> 标签    URL.revokeObjectURL(url);    document.body.removeChild(link);}export default saveChatLogAsTxt