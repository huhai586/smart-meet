const highlight = (text: string, highLights: string[]) => {
    return highLights.reduce((acc, cur) => {
        // 使用 \b (单词边界) 确保完全单词匹配
        const regex = new RegExp(`\\b${cur}\\b`, 'gi');
        return acc.replaceAll(regex, `<b class="highlight">${cur}</b>`);
    }, text);
};

export default highlight;
