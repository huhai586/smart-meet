import getIsExtensionDisabled from "../utils/get-is-extension-disabled";

export const updateBadgeText = () => {
// 初始化插件状态
    getIsExtensionDisabled().then((disabled: boolean) => {
        updateIcon(!disabled);
    });

    // 监听 storage 变化，实时更新 badge
    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== 'sync' || !changes['appConfig']) return;
        const newConfig = changes['appConfig'].newValue as Record<string, { value: unknown }> | undefined;
        if (!newConfig?.isExtensionDisabled) return;
        const disabled = !!newConfig.isExtensionDisabled.value;
        updateIcon(!disabled);
    });
}

function updateIcon(enabled: boolean) {
    const text = enabled ? '' : 'off';
    chrome.action.setBadgeText({
        text: text,
    });
    const color = enabled ? '#008000' : 'rgba(255, 230, 0, 0.5)';
    chrome.action.setBadgeBackgroundColor({
        color: color
    });
}
