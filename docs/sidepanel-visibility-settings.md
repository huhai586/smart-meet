# Sidepanel Visibility Settings

## 功能概述

主界面设置（Sidepanel Settings）允许用户自定义主界面侧边栏中显示的标签页和字幕操作按钮。

### 标签页可见性控制

用户可以选择显示或隐藏以下标签页：

- **字幕（Captions）**: 实时查看和管理会议字幕
- **AI Summary**: 生成AI驱动的会议摘要和见解
- **翻译（Translation）**: 访问翻译历史和单词记录

### 字幕操作按钮可见性控制

用户可以选择显示或隐藏每条字幕上的操作按钮：

- **翻译（Translate）**: 将字幕文本翻译成首选语言
- **润色（Polish）**: 使用AI改进和优化字幕文本
- **分析（Analysis）**: 从字幕中获取详细分析和见解

## 实现细节

### 1. 新增组件

**文件**: `components/options/SidepanelSettings.tsx`

这是一个新的设置页面组件，包含：
- 页面标题和描述
- 标签页可见性设置卡片（3个开关）
- 字幕操作按钮可见性设置卡片（3个开关）

**主要功能**:
- 从 `chrome.storage.local` 加载可见性设置
- 提供开关控件来切换每个标签页和按钮的可见性
- 实时保存设置到存储

**存储键**: 
- `sidepanelVisibility` - 标签页可见性
- `captionButtonsVisibility` - 按钮可见性

**数据结构**:
```typescript
interface SidepanelVisibility {
    captions: boolean;
    summary: boolean;
    translation: boolean;
}

interface CaptionButtonsVisibility {
    translate: boolean;
    polish: boolean;
    analysis: boolean;
}
```

### 2. 路由配置

在 `options.tsx` 中添加了新的路由：

- **路由路径**: `sidepanel-settings`
- **标签页key**: `'7'`
- **组件**: `<SidepanelSettings />`

### 3. Sidebar更新

在 `components/options/Sidebar.tsx` 中添加了新的菜单项：

- **图标**: `<AppstoreOutlined />`
- **标签**: `t('sidepanel_settings')` (主界面设置)
- **路由**: `sidepanel-settings`

### 4. Sidepanel逻辑

在 `sidepanel.tsx` 中实现了以下功能：

1. **加载可见性设置**: 从存储中读取用户的可见性偏好
2. **监听设置变化**: 使用 `chrome.storage.onChanged` 监听设置更新
3. **过滤标签页**: 只显示用户选择可见的标签页
4. **自动切换**: 当当前标签页被隐藏时，自动切换到第一个可见的标签页

### 5. 样式

在 `styles/extension-settings.scss` 中添加了 `.visibility-item` 样式：

- 卡片式布局
- Hover效果
- 响应式设计

### 6. 多语言支持

为所有15种语言添加了以下翻译键：

- `sidepanel_settings`: 主界面设置
- `sidepanel_visibility_settings`: 标签页可见性设置
- `sidepanel_visibility_desc`: 配置说明
- `captions_tab_desc`: 字幕标签页描述
- `summary_tab_desc`: AI Summary标签页描述
- `translation_tab_desc`: 翻译标签页描述

支持的语言：
- 英语 (en)
- 中文 (zh)
- 日语 (ja)
- 韩语 (ko)
- 泰语 (th)
- 阿拉伯语 (ar)
- 葡萄牙语 (pt)
- 西班牙语 (es)
- 波斯语 (fa)
- 法语 (fr)
- 德语 (de)
- 越南语 (vi)
- 印地语 (hi)
- 意大利语 (it)
- 俄语 (ru)

## 使用方法

1. 打开扩展设置页面
2. 在侧边栏中点击"主界面设置"
3. 使用开关控件来显示或隐藏标签页
4. 设置会自动保存
5. 打开sidepanel查看效果

## 默认行为

所有标签页默认都是显示的（`true`）。

## 技术要点

- 使用 `chrome.storage.local` 存储用户偏好
- 使用 `chrome.storage.onChanged` 实现实时同步
- 自动处理标签页切换逻辑，避免显示不可见的标签页
- 完整的多语言支持
- 响应式UI设计
