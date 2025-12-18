# 字幕不更新问题调试指南

## 问题描述
某些时候，Google Meeting 的字幕明明在更新，但插件却不能显示字幕，日志显示 `addOrUpdate` 方法不再被调用。

## 可能的原因

### 1. getCaptions 回调停止触发
**原因**: `google-meeting-captions-resolver` 库的 MutationObserver 可能失效

**检查方法**:
```javascript
// 在浏览器控制台执行
console.log('Testing getCaptions callback...');
```

**可能的情况**:
- Google Meet 更新了DOM结构
- MutationObserver 被意外断开
- 字幕容器元素被重新创建

**解决方案**:
- 添加重连机制
- 监听DOM变化，重新初始化 getCaptions
- 添加心跳检测

### 2. 扩展被禁用
**原因**: `isExtensionEnabled` 变为 false

**检查方法**:
```javascript
// 在浏览器控制台执行
console.log('Extension enabled:', window.isExtensionEnabled);
```

**解决方案**:
- 检查 `getIsExtensionDisabled()` 的逻辑
- 确保状态同步正确

### 3. Content Script 未正确加载
**原因**: 页面刷新或导航导致 content script 失效

**检查方法**:
- 查看 Chrome DevTools > Sources > Content Scripts
- 检查是否有多个 content script 实例

**解决方案**:
- 添加页面可见性监听
- 在页面重新激活时重新初始化

### 4. Chrome Runtime 连接断开
**原因**: Background script 和 content script 之间的连接断开

**检查方法**:
```javascript
// 检查 runtime 是否可用
console.log('Runtime available:', !!chrome.runtime?.id);
```

**解决方案**:
- 添加错误处理
- 实现自动重连

## 建议的改进方案

### 方案1: 添加心跳检测和重连机制

```typescript
let captionsObserver: any = null;
let lastCaptionTime = Date.now();
const HEARTBEAT_INTERVAL = 5000; // 5秒检查一次

const startCaptionsMonitoring = () => {
    if (captionsObserver) {
        console.log('Captions observer already running');
        return;
    }

    captionsObserver = getCaptions(undefined, (v) => {
        console.log('captions', v);
        lastCaptionTime = Date.now();
        addOrUpdateRecords(v);
    });
};

// 心跳检测
const heartbeatCheck = setInterval(() => {
    const timeSinceLastCaption = Date.now() - lastCaptionTime;
    
    // 如果超过30秒没有收到字幕更新，尝试重新初始化
    if (timeSinceLastCaption > 30000) {
        console.warn('No captions received for 30s, reinitializing...');
        captionsObserver = null;
        startCaptionsMonitoring();
        lastCaptionTime = Date.now();
    }
}, HEARTBEAT_INTERVAL);
```

### 方案2: 监听页面可见性变化

```typescript
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        console.log('Page became visible, checking captions...');
        // 重新初始化
        setTimeout(() => {
            startCaptionsMonitoring();
        }, 1000);
    }
});
```

### 方案3: 添加详细的调试日志

```typescript
const addOrUpdateRecords = (incomingData: Captions) => {
    console.log('[DEBUG] addOrUpdateRecords called', {
        enabled: isExtensionEnabled,
        data: incomingData,
        timestamp: new Date().toISOString()
    });
    
    if (!isExtensionEnabled) {
        console.warn('[DEBUG] Extension is disabled, skipping');
        return;
    }
    
    try {
        chrome.runtime.sendMessage({
            data: {...incomingData, timestamp: new Date().getTime(), meetingName: document.title},
            action: 'addOrUpdateRecords'
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('[DEBUG] Failed to send message:', chrome.runtime.lastError);
            } else {
                console.log('[DEBUG] Message sent successfully:', response);
            }
        });
    } catch (error) {
        console.error('[DEBUG] Exception in addOrUpdateRecords:', error);
    }
};
```

### 方案4: 监听 Google Meet 的特定事件

```typescript
// 监听字幕容器的变化
const observeCaptionContainer = () => {
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList') {
                console.log('[DEBUG] Caption container changed');
                // 可能需要重新初始化
            }
        }
    });

    // 查找字幕容器
    const captionContainer = document.querySelector('[jsname="dsyhDe"]');
    if (captionContainer) {
        observer.observe(captionContainer, {
            childList: true,
            subtree: true
        });
        console.log('[DEBUG] Caption container observer started');
    } else {
        console.warn('[DEBUG] Caption container not found');
    }
};
```

## 调试步骤

1. **打开 Chrome DevTools 控制台**
2. **检查是否有 "captions" 日志输出**
   - 如果没有，说明 getCaptions 回调未被触发
3. **手动测试回调**:
   ```javascript
   window.huhai({activeSpeaker: 'Test', talkContent: 'Test message'})
   ```
4. **检查扩展状态**:
   ```javascript
   chrome.storage.local.get(['isExtensionDisabled'], (result) => {
       console.log('Extension disabled:', result.isExtensionDisabled);
   });
   ```
5. **检查 content script 是否加载**:
   - DevTools > Sources > Content Scripts
   - 应该能看到 contents/index.ts

## 临时解决方案

如果遇到字幕不更新的问题，用户可以：
1. 刷新 Google Meet 页面
2. 重新打开 sidepanel
3. 禁用并重新启用扩展
4. 关闭并重新加入会议

## 需要收集的信息

当问题发生时，请收集：
1. Chrome 版本
2. 扩展版本
3. Google Meet 页面的 URL
4. 控制台的完整日志
5. 是否有任何错误信息
6. 问题发生前的操作（如切换标签页、最小化窗口等）
