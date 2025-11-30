# 浏览器启动自动同步功能

## 功能说明

当浏览器启动时，如果用户启用了该功能，扩展会自动检查并同步最近5天的会议数据。

**默认状态：关闭**（用户需要在 Google Drive 设置页面手动开启）

## 工作流程

1. **浏览器启动触发**
   - 监听 `chrome.runtime.onStartup` 事件
   - 仅在浏览器启动时触发（不包括扩展重新加载）

2. **检查认证状态**
   - 使用非交互式方式检查 Google Drive 认证
   - 如果未授权，跳过自动同步（不打扰用户）

3. **数据对比**
   - 获取本地已有数据的日期列表
   - 获取 Google Drive 上的备份文件列表
   - 对比最近5天的数据

4. **简单同步逻辑**
   - 只检查本地是否有该日期的记录
   - 有记录 → 跳过同步
   - 无记录 → 从 Google Drive 下载

## 数据存在性检查方法

### 方法1: 检查特定日期是否有数据
```typescript
const storage = StorageFactory.getInstance().getProvider();
const records = await storage.getRecords(dayjs('2024-11-28'));
const hasData = records.length > 0;
```

### 方法2: 获取所有有数据的日期
```typescript
const storage = StorageFactory.getInstance().getProvider();
const daysWithMessages = await storage.getDaysWithMessages();
// 返回: ['2024-11-26', '2024-11-27', '2024-11-28']
```

### 方法3: 对比 Google Drive 和本地数据
```typescript
// 获取 Google Drive 文件列表
const driveService = GoogleDriveService.getInstance();
const driveFiles = await driveService.listBackupFiles();

// 获取本地数据日期
const storage = StorageFactory.getInstance().getProvider();
const localDays = await storage.getDaysWithMessages();

// 找出差异
const missingDates = driveFiles
  .map(file => file.name.replace('.json', ''))
  .filter(date => !localDays.includes(date));
```

## 手动触发同步

如果需要手动触发同步（用于测试），可以在 background 控制台中执行：

```javascript
// 在 Chrome DevTools 的 Service Worker 控制台中
import { BrowserStartupSyncService } from './browser-startup-sync';
const syncService = BrowserStartupSyncService.getInstance();
await syncService.manualSync();
```

## 如何启用

1. 打开扩展的选项页面（Options）
2. 找到 Google Drive 备份部分
3. 开启"浏览器启动时自动同步"开关
4. 重启浏览器后生效

## 注意事项

1. **默认关闭**
   - 该功能默认关闭，需要用户手动在设置页面开启
   - 设置保存在 `chrome.storage.sync` 中，跨设备同步

2. **非交互式认证**
   - 启动同步使用非交互式认证，不会弹出授权窗口
   - 如果用户未授权，会静默跳过同步

2. **数据更新策略**
   - 只检查日期是否存在，不检查内容
   - 本地有该日期的记录就跳过，避免重复下载

3. **性能考虑**
   - 仅同步最近5天的数据，避免启动时间过长
   - 使用异步操作，不阻塞浏览器启动

4. **错误处理**
   - 所有错误都会被捕获并记录到控制台
   - 同步失败不会影响扩展的正常使用

## 测试方法

1. **启用功能**
   ```bash
   # 1. 打开扩展选项页面
   # 2. 在 Google Drive 备份部分找到"浏览器启动时自动同步"
   # 3. 开启该开关
   ```

2. **测试浏览器启动同步**
   ```bash
   # 1. 完全关闭 Chrome 浏览器
   # 2. 重新启动 Chrome
   # 3. 打开扩展的 Service Worker 控制台
   # 4. 查看日志输出，应该看到同步相关的日志
   ```

2. **测试数据检查逻辑**
   ```typescript
   // 在 background 控制台中
   const storage = StorageFactory.getInstance().getProvider();
   const days = await storage.getDaysWithMessages();
   console.log('本地有数据的日期:', days);
   ```

3. **测试 Google Drive 对比**
   ```typescript
   // 在 background 控制台中
   const driveService = GoogleDriveService.getInstance();
   await driveService.authenticate(true);
   const files = await driveService.listBackupFiles();
   console.log('Google Drive 文件:', files.map(f => f.name));
   ```

## 未来改进方向

1. **可配置的同步范围**
   - 允许用户设置同步天数（5天、7天、30天等）
   - 支持选择性同步特定日期

2. **同步状态通知**
   - 在扩展图标上显示同步状态
   - 同步完成后发送通知

3. **强制重新同步选项**
   - 允许用户强制重新下载某个日期的数据
   - 用于修复数据不一致的情况
