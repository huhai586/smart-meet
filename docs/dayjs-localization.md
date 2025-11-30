# Dayjs 本地化配置

## 概述

日历视图中的日期格式（月份名称、星期几等）现在支持多语言显示，会根据用户选择的界面语言自动切换。

## 实现方式

### 1. Dayjs 配置文件 (`utils/dayjs-config.ts`)

- 导入所有支持的语言包
- 提供 `setDayjsLocale(langCode)` 函数来切换语言
- 映射我们的语言代码到 dayjs 的 locale 代码

### 2. 支持的语言

| 语言 | 代码 | Dayjs Locale |
|------|------|--------------|
| 英语 | en | en |
| 中文 | zh | zh-cn |
| 日语 | ja | ja |
| 韩语 | ko | ko |
| 西班牙语 | es | es |
| 法语 | fr | fr |
| 德语 | de | de |
| 意大利语 | it | it |
| 葡萄牙语 | pt | pt |
| 俄语 | ru | ru |
| 阿拉伯语 | ar | ar |
| 印地语 | hi | hi |
| 泰语 | th | th |
| 越南语 | vi | vi |
| 波斯语 | fa | fa |

### 3. 使用方式

在需要使用 dayjs 格式化日期的组件中：

```typescript
import { useI18n } from '~utils/i18n';
import { setDayjsLocale } from '~utils/dayjs-config';

const MyComponent = () => {
  const { langCode } = useI18n();

  // 当语言改变时，更新 dayjs locale
  useEffect(() => {
    setDayjsLocale(langCode);
  }, [langCode]);

  // 现在 dayjs 会使用正确的语言格式化日期
  const formattedDate = dayjs().format('MMMM YYYY'); // 例如: "January 2024" 或 "2024年1月"
};
```

## 日期格式示例

### 英语 (en)
- 月份: January, February, March...
- 星期: Monday, Tuesday, Wednesday...
- 格式: January 15, 2024

### 中文 (zh)
- 月份: 一月, 二月, 三月...
- 星期: 星期一, 星期二, 星期三...
- 格式: 2024年1月15日

### 日语 (ja)
- 月份: 1月, 2月, 3月...
- 星期: 月曜日, 火曜日, 水曜日...
- 格式: 2024年1月15日

### 其他语言
每种语言都会使用其本地化的日期格式。

## 已集成的组件

- **Calendar.tsx** - 日历视图组件
- **options.tsx** - 选项页面主组件

## 注意事项

1. **自动切换**: 当用户在设置中更改界面语言时，dayjs 的 locale 会自动更新
2. **实时生效**: 日期格式会立即更新，无需刷新页面
3. **全局配置**: dayjs 配置在应用启动时加载，确保所有组件都能使用正确的语言

## 测试

1. 打开选项页面
2. 切换到日历视图
3. 更改界面语言设置
4. 观察月份名称和星期几是否正确显示为所选语言

例如：
- 英语: "January 2024", "Monday"
- 中文: "2024年1月", "星期一"
- 日语: "2024年1月", "月曜日"
