import getIsExtensionEnabled from "../utils/get-is-extension-enabled";

export const updateBadgeText = () => {
// 初始化插件状态
    getIsExtensionEnabled().then((enabled: boolean) => {
        updateIcon(enabled);
    });
}

function updateIcon(enabled: boolean) {
    let text = enabled ? '' : 'off';
    chrome.action.setBadgeText({
        text: text,
    });
    let color = enabled ? '#008000' : 'rgba(255, 230, 0, 0.5)';
    chrome.action.setBadgeBackgroundColor({
        color: color
    });
}
