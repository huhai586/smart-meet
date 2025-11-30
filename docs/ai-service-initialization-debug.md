# AI 服务初始化调试指南

## 问题描述

在扩展设置页面点击"生成关键词"按钮时，提示需要配置 AI 服务，即使已经在 AI 设置页面配置了服务。

## 调试步骤

### 1. 检查 AI 配置是否保存

打开浏览器控制台（F12），执行：

```javascript
chrome.storage.sync.get(['AIs'], (result) => {
  console.log('AI Configuration:', result.AIs);
});
```

应该看到类似这样的输出：
```json
{
  "active": "gemini",
  "data": [
    {
      "aiName": "gemini",
      "apiKey": "your-api-key",
      "modelName": "gemini-2.0-flash"
    }
  ]
}
```

### 2. 检查 Options 页面的 AI 服务初始化

1. 打开 Options 页面（设置页面）
2. 打开浏览器控制台
3. 查找以下日志：

```
[Options] Loading AI service...
[Options] AI config loaded: {...}
[Options] Active service: {...}
[Options] Initializing AI service: gemini
[Options] AI service initialized successfully: gemini
```

如果看不到这些日志，说明初始化代码没有执行。

### 3. 检查 AI 服务状态

在控制台执行：

```javascript
// 导入 AI 服务管理器（需要在页面上下文中）
const aiServiceManager = window.aiServiceManager || require('./utils/ai').default;

// 检查当前服务类型
console.log('Current service type:', aiServiceManager.getCurrentServiceType());

// 检查已初始化的服务
console.log('Initialized services:', aiServiceManager.getInitializedServices());

// 检查当前服务是否准备就绪
const currentService = aiServiceManager.getCurrentService();
console.log('Current service:', currentService);
console.log('Is ready:', currentService ? currentService.isReady() : 'No service');
```

### 4. 测试生成关键词功能

1. 切换到扩展设置页面
2. 填写领域和关键词描述
3. 打开控制台
4. 点击"生成关键词"按钮
5. 查看控制台日志：

```
[Extension] Generating keywords...
[askAI] Using service: gemini
[Extension] AI response: ...
```

如果看到 `[askAI] AI service not ready`，说明服务没有正确初始化。

## 常见问题和解决方案

### 问题 1: AI 配置存在但服务未初始化

**症状：** 
- `chrome.storage.sync.get(['AIs'])` 返回正确的配置
- 但看不到 `[Options] AI service initialized successfully` 日志

**可能原因：**
- Options 页面的 useEffect 没有执行
- `getAllAIServiceConfigs()` 返回了空数据

**解决方案：**
1. 刷新 Options 页面
2. 检查是否有 JavaScript 错误
3. 确认 `getAllAIServiceConfigs` 函数正常工作

### 问题 2: 服务初始化了但 isReady() 返回 false

**症状：**
- 看到 `[Options] AI service initialized successfully`
- 但 `isReady()` 仍然返回 `false`

**可能原因：**
- API key 为空
- 服务初始化过程中出错
- `isInitialized` 标志没有被设置

**解决方案：**
1. 检查 API key 是否正确
2. 查看是否有初始化错误日志
3. 重新保存 AI 配置

### 问题 3: 页面刷新后服务丢失

**症状：**
- 第一次打开页面时工作正常
- 刷新后服务不可用

**可能原因：**
- AI 服务管理器是单例，但页面刷新后重新创建
- 需要重新初始化

**解决方案：**
- 这是正常行为，每次页面加载都会重新初始化
- 确保 useEffect 在每次页面加载时都执行

## 手动修复步骤

如果自动初始化失败，可以手动触发：

1. 打开 Options 页面
2. 打开控制台
3. 执行以下代码：

```javascript
(async () => {
  const { getAllAIServiceConfigs } = await import('./utils/getAI');
  const aiServiceManager = (await import('./utils/ai')).default;
  
  const aisConfig = await getAllAIServiceConfigs();
  console.log('Config:', aisConfig);
  
  const activeService = aisConfig.data.find(svc => svc.aiName === aisConfig.active);
  console.log('Active service:', activeService);
  
  if (activeService && activeService.apiKey) {
    await aiServiceManager.initService(activeService.aiName, activeService);
    aiServiceManager.setCurrentServiceType(activeService.aiName);
    console.log('Service initialized!');
  }
})();
```

## 验证修复

修复后，执行以下验证：

1. 刷新 Options 页面
2. 查看控制台是否有初始化日志
3. 切换到扩展设置页面
4. 点击"生成关键词"
5. 应该能正常生成关键词，不再提示配置 AI 服务

## 需要提供的调试信息

如果问题仍然存在，请提供：

1. 控制台的完整日志（包括错误）
2. `chrome.storage.sync.get(['AIs'])` 的输出
3. `aiServiceManager.getInitializedServices()` 的输出
4. 浏览器版本和扩展版本
