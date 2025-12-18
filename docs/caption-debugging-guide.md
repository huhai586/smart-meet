# 字幕不更新问题 - 调试使用指南

## 快速诊断

当字幕停止更新时，在 Chrome DevTools 控制台执行以下命令：

### 1. 检查调试信息
```javascript
window.captionDebug
```

这会显示：
```javascript
{
  getLastCaptionTime: ƒ,      // 最后接收字幕的时间
  getTimeSinceLastCaption: ƒ, // 距离上次接收的时间
  isExtensionEnabled: ƒ,      // 扩展是否启用
  reconnectAttempts: ƒ,       // 重连尝试次数
  checkContainer: ƒ,          // 检查字幕容器是否存在
  forceReconnect: ƒ           // 强制重连
}
```

### 2. 查看详细状态
```javascript
console.log('Last caption:', window.captionDebug.getLastCaptionTime());
console.log('Time since:', window.captionDebug.getTimeSinceLastCaption());
console.log('Extension enabled:', window.captionDebug.isExtensionEnabled());
console.log('Reconnect attempts:', window.captionDebug.reconnectAttempts());
console.log('Container exists:', window.captionDebug.checkContainer());
```

### 3. 手动触发重连
```javascript
window.captionDebug.forceReconnect();
```

### 4. 手动测试回调
```javascript
window.huhai({
  activeSpeaker: 'Test User',
  talkContent: 'This is a test message'
});
```

## 自动恢复机制

插件现在包含以下自动恢复功能：

### 1. 心跳检测
- 每10秒检查一次是否收到字幕更新
- 如果超过30秒没有更新，输出警告日志

### 2. 自动重连
- 检测到30秒无更新时，自动尝试重连
- 最多尝试3次重连
- 每次重连间隔2秒

### 3. 框架过滤
- 只在主框架中运行，避免多实例冲突
- 减少资源消耗

### 4. 页面可见性监听
- 监听标签页切换
- 页面重新可见时重置心跳时间

## 日志过滤

在控制台中过滤相关日志：

```
[Caption]
```

这会显示所有字幕相关的日志，包括：
- `[Caption] Received caption:` - 收到新字幕
- `[Caption] No captions received for 30 seconds` - 30秒无更新警告
- `[Caption] Attempting to reconnect...` - 尝试重连
- `[Caption] Observer started successfully` - 监听器启动成功

## 常见问题排查

### 问题1: 字幕容器不存在
```javascript
window.captionDebug.checkContainer()
// 返回 false
```

**原因**: Google Meet 的字幕功能未开启或DOM结构变化

**解决方案**:
1. 确保 Google Meet 的字幕已开启（点击CC按钮）
2. 刷新页面
3. 检查是否是 Google Meet 更新导致的选择器变化

### 问题2: 扩展被禁用
```javascript
window.captionDebug.isExtensionEnabled()
// 返回 false
```

**原因**: 扩展在设置中被禁用

**解决方案**:
1. 打开扩展设置
2. 启用扩展
3. 刷新页面

### 问题3: 重连次数达到上限
```javascript
window.captionDebug.reconnectAttempts()
// 返回 3
```

**原因**: 自动重连失败3次

**解决方案**:
1. 手动触发重连: `window.captionDebug.forceReconnect()`
2. 如果仍然失败，刷新页面
3. 检查控制台是否有错误信息

### 问题4: 时间显示很长但没有重连
```javascript
window.captionDebug.getTimeSinceLastCaption()
// 返回 "120s"
```

**原因**: 可能是页面被隐藏，心跳检测暂停

**解决方案**:
1. 切换回标签页
2. 手动触发重连
3. 检查心跳检测是否正常运行

## 性能监控

### 检查内存使用
```javascript
// 查看性能信息
console.log(performance.memory);
```

### 检查 MutationObserver 数量
```javascript
// 这个需要在开发者工具的 Performance 标签中查看
// 录制一段时间后查看 "Observer Callbacks" 的数量
```

## 报告问题

如果问题持续存在，请收集以下信息：

1. **基本信息**:
   ```javascript
   console.log({
     chromeVersion: navigator.userAgent,
     extensionVersion: chrome.runtime.getManifest().version,
     meetUrl: window.location.href
   });
   ```

2. **调试状态**:
   ```javascript
   console.log({
     lastCaption: window.captionDebug.getLastCaptionTime(),
     timeSince: window.captionDebug.getTimeSinceLastCaption(),
     enabled: window.captionDebug.isExtensionEnabled(),
     attempts: window.captionDebug.reconnectAttempts(),
     container: window.captionDebug.checkContainer()
   });
   ```

3. **控制台日志**:
   - 过滤 `[Caption]` 的所有日志
   - 截图或复制文本

4. **操作步骤**:
   - 问题发生前的操作
   - 是否切换了标签页
   - 是否最小化了窗口
   - 会议持续时间

## 临时解决方案

如果自动恢复失败，用户可以：

1. **手动重连** (最快):
   ```javascript
   window.captionDebug.forceReconnect()
   ```

2. **刷新页面** (推荐):
   - 按 F5 或 Cmd+R
   - 字幕会重新开始捕获

3. **重新加入会议**:
   - 退出并重新加入会议
   - 确保字幕已开启

4. **重启扩展**:
   - 在 chrome://extensions 中禁用并重新启用扩展
   - 刷新 Google Meet 页面
