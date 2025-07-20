# AI Settings Module

AI设置模块的重构版本，将原来的980行超长文件重构为模块化的组件结构。

## 📁 文件结构

```
ai-settings/
├── components/          # UI组件
│   ├── ApiKeyConfig.tsx    # API密钥配置组件
│   ├── ModelSelector.tsx   # 模型选择组件
│   ├── ServiceConfigPanel.tsx # 服务配置面板
│   ├── ServiceList.tsx     # 服务列表侧边栏
│   └── StyledComponents.tsx # 样式组件
├── hooks/               # 自定义Hooks
│   └── index.ts            # 模型获取Hook
├── utils/               # 工具函数
│   ├── api-test-service.ts # API密钥测试服务
│   ├── constants.ts        # 常量定义
│   ├── model-service.ts    # 模型获取服务
│   └── service-helpers.ts  # 服务辅助函数
├── AISettings.tsx       # 主组件
├── index.ts            # 模块入口文件
└── README.md           # 文档说明
```

## 🔧 模块功能

### Components 组件
- **ServiceList**: 左侧服务列表，显示所有支持的AI服务和配置状态
- **ServiceConfigPanel**: 右侧配置面板，包含API密钥、模型选择等配置
- **ApiKeyConfig**: API密钥输入和测试组件
- **ModelSelector**: 模型选择下拉框组件，支持动态获取模型列表
- **StyledComponents**: 所有样式组件的集合

### Utils 工具
- **constants**: AI服务类型、显示信息、预定义模型等常量
- **service-helpers**: 获取服务名称、图标、默认模型等辅助函数
- **api-test-service**: API密钥有效性测试功能
- **model-service**: 模型列表获取功能，支持OpenAI API调用和预设模型

### Hooks
- **useFetchModels**: 自定义Hook，处理模型获取的状态管理

## 🎯 优化亮点

1. **模块化设计**: 将980行代码拆分为多个职责单一的组件
2. **类型安全**: 使用TypeScript严格类型检查
3. **代码复用**: 提取公共工具函数和常量
4. **状态管理**: 使用自定义Hook管理复杂状态
5. **错误处理**: 统一的API测试和错误处理机制
6. **可维护性**: 清晰的文件结构，便于后续维护和扩展

## 🔄 使用方式

```tsx
import AISettings from '~/components/options/ai-settings';

// 在options页面中使用
<AISettings />
```

## 📝 扩展说明

如需添加新的AI服务：
1. 在 `constants.ts` 中添加服务信息
2. 在 `api-test-service.ts` 中添加测试逻辑
3. 在 `model-service.ts` 中添加模型获取逻辑（如需要）
