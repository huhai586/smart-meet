# google-meeting-captions-resolver 库分析

## 库信息
- **版本**: 1.1.3
- **用途**: 从 Google Meet 页面提取字幕内容
- **实现方式**: 使用 MutationObserver 监听 DOM 变化

## 可能导致回调停止的原因

### 1. MutationObserver 断开连接

**原因**:
- Google Meet 动态重建了字幕容器的 DOM 结构
- 页面进行了部分刷新或重新渲染
- 字幕容器元素被移除后重新添加

**表现**:
- 回调突然停止被调用
- 没有任何错误信息
- Google Meet 的字幕仍在正常显示

**检测方法**:
```javascript
// 检查字幕容器是否存在
const captionContainer = document.querySelector('[jsname="dsyhDe"]');
console.log('Caption container exists:', !!captionContainer);
```

### 2. Google Meet DOM 结构变化

**原因**:
- Google Meet 更新了字幕容器的选择器
- 字幕元素的 jsname 或其他属性发生变化
- Google Meet 推出了新的 UI 版本

**常见的字幕容器选择器**:
```javascript
// 可能的选择器（按优先级）
const selectors = [
  '[jsname="dsyhDe"]',           // 主要字幕容器
  '.a4cQT',                       // 字幕文本容器
  '[data-is-muted]',              // 说话者信息
  '.iTTPOb',                      // 字幕行
  '.CNusmb'                       // 字幕内容
];
```

**检测方法**:
```javascript
// 检查所有可能的选择器
selectors.forEach(selector => {
  const element = document.querySelector(selector);
  console.log(`${selector}:`, !!element);
});
```

### 3. 字幕容器被隐藏或移除

**原因**:
- 用户关闭了字幕
- 字幕被临时隐藏（如全屏模式切换）
- 会议界面切换（如演示模式）

**检测方法**:
```javascript
const container = document.querySelector('[jsname="dsyhDe"]');
if (container) {
  const style = window.getComputedStyle(container);
  console.log('Container visible:', style.display !== 'none' && style.visibility !== 'hidden');
}
```

### 4. MutationObserver 配置问题

**可能的问题**:
- Observer 只监听了 `childList`，但字幕更新使用了 `characterData`
- Observer 没有设置 `subtree: true`，无法监听深层变化
- Observer 的 `attributeFilter` 过滤掉了关键属性

**标准配置**:
```javascript
const config = {
  childList: true,      // 监听子节点添加/删除
  subtree: true,        // 监听所有后代节点
  characterData: true,  // 监听文本内容变化
  attributes: false     // 不监听属性变化（性能优化）
};
```

### 5. 内存泄漏或性能问题

**原因**:
- 长时间运行导致内存占用过高
- 回调函数中的操作过于耗时
- 浏览器限制了 Observer 的触发频率

**表现**:
- 回调逐渐变慢
- 最终完全停止
- 浏览器标签页变卡

### 6. 多个 Content Script 实例冲突

**原因**:
- `all_frames: true` 导致在多个 iframe 中都注入了脚本
- 页面刷新时旧的 Observer 没有被清理
- 多个 Observer 相互干扰

**检测方法**:
```javascript
// 检查当前页面的 frame 数量
console.log('Total frames:', window.frames.length);
console.log('Is top frame:', window === window.top);
```

### 7. Chrome 扩展上下文失效

**原因**:
- 扩展被重新加载
- Content script 的执行上下文被销毁
- Chrome runtime 连接断开

**检测方法**:
```javascript
try {
  chrome.runtime.sendMessage({test: true}, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Runtime disconnected:', chrome.runtime.lastError);
    }
  });
} catch (error) {
  console.error('Runtime not available:', error);
}
```

## 解决方案

### 方案1: 实现自动重连机制

```typescript
let captionsObserver: any = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 3;

const startCaptionsMonitoring = () => {
  try {
    if (captionsObserver) {
      console.log('[Caption] Observer already exists, skipping');
      return;
    }

    console.log('[Caption] Starting captions observer...');
    captionsObserver = getCaptions(undefined, (v) => {
      console.log('[Caption] Received:', v);
      lastCaptionTime = Date.now();
      reconnectAttempts = 0; // 重置重连计数
      addOrUpdateRecords(v);
    });
    
    console.log('[Caption] Observer started successfully');
  } catch (error) {
    console.error('[Caption] Failed to start observer:', error);
  }
};

// 心跳检测中添加重连逻辑
const heartbeatCheck = () => {
  const timeSinceLastCaption = Date.now() - lastCaptionTime;
  
  if (timeSinceLastCaption > 30000 && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
    console.warn('[Caption] No captions for 30s, attempting reconnect...');
    reconnectAttempts++;
    
    // 清理旧的 observer
    captionsObserver = null;
    
    // 延迟重连，避免频繁操作
    setTimeout(() => {
      startCaptionsMonitoring();
    }, 2000);
  }
};
```

### 方案2: 只在主框架中运行

```typescript
// 在 contents/index.ts 开头添加
if (window !== window.top) {
  console.log('[Caption] Not in top frame, skipping');
  // 不执行任何操作
} else {
  // 正常启动
  start();
}
```

### 方案3: 监听字幕容器的存在性

```typescript
const waitForCaptionContainer = (callback: () => void, timeout = 10000) => {
  const startTime = Date.now();
  
  const checkContainer = () => {
    const container = document.querySelector('[jsname="dsyhDe"]');
    
    if (container) {
      console.log('[Caption] Container found');
      callback();
    } else if (Date.now() - startTime < timeout) {
      setTimeout(checkContainer, 500);
    } else {
      console.warn('[Caption] Container not found after timeout');
    }
  };
  
  checkContainer();
};

// 使用方式
waitForCaptionContainer(() => {
  startCaptionsMonitoring();
});
```

### 方案4: 添加容器变化监听

```typescript
const observeContainerChanges = () => {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      // 检查字幕容器是否被移除
      mutation.removedNodes.forEach((node) => {
        if (node instanceof Element && node.matches('[jsname="dsyhDe"]')) {
          console.warn('[Caption] Container removed, will reinitialize');
          captionsObserver = null;
        }
      });
      
      // 检查字幕容器是否被添加
      mutation.addedNodes.forEach((node) => {
        if (node instanceof Element && node.matches('[jsname="dsyhDe"]')) {
          console.log('[Caption] Container added, reinitializing');
          setTimeout(() => {
            startCaptionsMonitoring();
          }, 1000);
        }
      });
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
};
```

### 方案5: 升级库版本或使用替代方案

如果问题持续存在，考虑：
1. 检查 `google-meeting-captions-resolver` 是否有更新版本
2. Fork 该库并修复问题
3. 实现自己的字幕捕获逻辑

## 调试清单

当问题发生时，按顺序检查：

1. ✅ 字幕容器是否存在
2. ✅ 字幕容器是否可见
3. ✅ 是否在主框架中运行
4. ✅ Chrome runtime 是否可用
5. ✅ 是否有多个 content script 实例
6. ✅ 控制台是否有错误信息
7. ✅ 最后一次接收字幕的时间
8. ✅ 扩展是否被禁用

## 推荐的监控指标

```typescript
// 添加到 window 对象，方便调试
window.captionDebug = {
  lastCaptionTime,
  isExtensionEnabled,
  reconnectAttempts,
  getTimeSinceLastCaption: () => Date.now() - lastCaptionTime,
  checkContainer: () => !!document.querySelector('[jsname="dsyhDe"]'),
  forceReconnect: () => {
    captionsObserver = null;
    startCaptionsMonitoring();
  }
};
```

## 参考资源

- [MutationObserver MDN](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver)
- [Chrome Extension Content Scripts](https://developer.chrome.com/docs/extensions/mv3/content_scripts/)
- [google-meeting-captions-resolver GitHub](https://github.com/search?q=google-meeting-captions-resolver)
