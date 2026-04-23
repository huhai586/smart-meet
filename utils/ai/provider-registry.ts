/**
 * AI Provider Registry
 * 定义所有支持的 AI 服务商及其配置信息
 */

export type ProviderCategory = 'international' | 'chinese' | 'local' | 'custom';
export type ProviderType = 'openai-compatible' | 'google' | 'anthropic' | 'ollama';

export interface ProviderDefinition {
  id: string;
  name: string;
  nameZh?: string; // 中文名，用于搜索
  icon: string;
  category: ProviderCategory;
  type: ProviderType;
  defaultBaseURL: string;
  apiKeyUrl?: string;
  defaultModel: string;
  models: string[];
  requiresApiKey: boolean;
  description?: string;
}

// ============================================================
// Built-in Provider Definitions
// ============================================================

const INTERNATIONAL_PROVIDERS: ProviderDefinition[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    icon: '🤖',
    category: 'international',
    type: 'openai-compatible',
    defaultBaseURL: 'https://api.openai.com/v1',
    apiKeyUrl: 'https://platform.openai.com/api-keys',
    defaultModel: 'gpt-4o-mini',
    models: [
      // GPT-4o series
      'gpt-4o', 'gpt-4o-mini',
      // GPT-4.1 series (2025)
      'gpt-4.1', 'gpt-4.1-mini', 'gpt-4.1-nano',
      // o-series reasoning
      'o4-mini', 'o3', 'o3-mini', 'o1', 'o1-mini',
      // legacy
      'gpt-4-turbo', 'gpt-3.5-turbo',
    ],
    requiresApiKey: true,
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    icon: '🧠',
    category: 'international',
    type: 'anthropic',
    defaultBaseURL: 'https://api.anthropic.com',
    apiKeyUrl: 'https://console.anthropic.com/settings/keys',
    defaultModel: 'claude-sonnet-4-5',
    models: [
      // Claude 4 series (latest)
      'claude-opus-4-5', 'claude-sonnet-4-5', 'claude-haiku-4-5',
      // Claude 3.7
      'claude-sonnet-3-7',
      // Claude 3.5
      'claude-opus-3-5', 'claude-sonnet-3-5', 'claude-haiku-3-5',
    ],
    requiresApiKey: true,
  },
  {
    id: 'google-gemini',
    name: 'Google Gemini',
    icon: '💎',
    category: 'international',
    type: 'google',
    defaultBaseURL: 'https://generativelanguage.googleapis.com/v1beta',
    apiKeyUrl: 'https://aistudio.google.com/apikey',
    defaultModel: 'gemini-2.5-flash',
    models: [
      // Gemini 3 (preview — latest generation, may require allowlist)
      'gemini-3.1-pro-preview', 'gemini-3-flash-preview', 'gemini-3.1-flash-lite-preview',
      // Gemini 2.5 (stable, recommended for production)
      'gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.5-flash-lite',
      // Gemini 1.5 (legacy)
      'gemini-1.5-pro', 'gemini-1.5-flash',
    ],
    requiresApiKey: true,
  },
  {
    id: 'xai-grok',
    name: 'xAI Grok',
    icon: '✨',
    category: 'international',
    type: 'openai-compatible',
    defaultBaseURL: 'https://api.x.ai/v1',
    apiKeyUrl: 'https://x.ai/api',
    defaultModel: 'grok-4.20',
    models: [
      'grok-4.20', 'grok-4.20-0309-reasoning', 'grok-4.20-0309-non-reasoning',
      'grok-4-1-fast-reasoning', 'grok-4-1-fast-non-reasoning',
      'grok-3', 'grok-3-mini',
    ],
    requiresApiKey: true,
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    icon: '🌀',
    category: 'international',
    type: 'openai-compatible',
    defaultBaseURL: 'https://api.mistral.ai/v1',
    apiKeyUrl: 'https://console.mistral.ai/api-keys',
    defaultModel: 'mistral-large-latest',
    models: [
      'mistral-large-latest', 'mistral-medium-latest', 'mistral-small-latest',
      'pixtral-large-latest', 'ministral-8b-latest', 'ministral-3b-latest',
      'codestral-latest',
    ],
    requiresApiKey: true,
  },
  {
    id: 'groq',
    name: 'Groq',
    icon: '⚡',
    category: 'international',
    type: 'openai-compatible',
    defaultBaseURL: 'https://api.groq.com/openai/v1',
    apiKeyUrl: 'https://console.groq.com/keys',
    defaultModel: 'llama-3.3-70b-versatile',
    models: [
      // Production
      'llama-3.3-70b-versatile', 'llama-3.1-8b-instant',
      'openai/gpt-oss-120b', 'openai/gpt-oss-20b',
      // Preview
      'meta-llama/llama-4-scout-17b-16e-instruct',
      'qwen/qwen3-32b',
      'gemma2-9b-it',
    ],
    requiresApiKey: true,
  },
  {
    id: 'together-ai',
    name: 'Together AI',
    icon: '🤝',
    category: 'international',
    type: 'openai-compatible',
    defaultBaseURL: 'https://api.together.xyz/v1',
    apiKeyUrl: 'https://api.together.xyz/settings/api-keys',
    defaultModel: 'meta-llama/Meta-Llama-3.3-70B-Instruct-Turbo',
    models: [
      'meta-llama/Meta-Llama-3.3-70B-Instruct-Turbo',
      'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
      'Qwen/Qwen2.5-72B-Instruct-Turbo',
      'Qwen/Qwen3-235B-A22B',
      'deepseek-ai/DeepSeek-V3',
      'mistralai/Mistral-7B-Instruct-v0.3',
    ],
    requiresApiKey: true,
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    icon: '🔍',
    category: 'international',
    type: 'openai-compatible',
    defaultBaseURL: 'https://api.perplexity.ai',
    apiKeyUrl: 'https://www.perplexity.ai/settings/api',
    defaultModel: 'sonar',
    models: [
      'sonar', 'sonar-pro', 'sonar-reasoning', 'sonar-reasoning-pro',
      'sonar-deep-research',
      'r1-1776',
    ],
    requiresApiKey: true,
  },
];

const CHINESE_PROVIDERS: ProviderDefinition[] = [
  {
    id: 'deepseek',
    name: 'DeepSeek',
    nameZh: '深度求索',
    icon: '🐋',
    category: 'chinese',
    type: 'openai-compatible',
    defaultBaseURL: 'https://api.deepseek.com/v1',
    apiKeyUrl: 'https://platform.deepseek.com/api_keys',
    defaultModel: 'deepseek-chat',
    models: [
      'deepseek-chat',        // DeepSeek-V3 alias
      'deepseek-reasoner',    // DeepSeek-R1 alias
    ],
    requiresApiKey: true,
  },
  {
    id: 'qwen',
    name: 'Qwen (Alibaba)',
    nameZh: '通义千问',
    icon: '☁️',
    category: 'chinese',
    type: 'openai-compatible',
    defaultBaseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiKeyUrl: 'https://dashscope.console.aliyun.com/apiKey',
    defaultModel: 'qwen3-max',
    models: [
      // Qwen3 commercial (latest)
      'qwen3-max', 'qwen3.6-plus', 'qwen3.6-flash',
      // Stable aliases
      'qwen-plus', 'qwen-turbo', 'qwen-long',
      // Vision
      'qwen3-vl-plus', 'qwen3-vl-flash',
      // Reasoning
      'qwq-plus',
    ],
    requiresApiKey: true,
  },
  {
    id: 'zhipu-glm',
    name: 'Zhipu GLM',
    nameZh: '智谱清言',
    icon: '🔮',
    category: 'chinese',
    type: 'openai-compatible',
    defaultBaseURL: 'https://open.bigmodel.cn/api/paas/v4',
    apiKeyUrl: 'https://open.bigmodel.cn/usercenter/apikeys',
    defaultModel: 'glm-4-flash',
    models: [
      'glm-5.1', 'glm-5', 'glm-4.7', 'glm-4.6', 'glm-4.5', 'glm-4.5-air',
      'glm-4', 'glm-4-flash', 'glm-4-plus', 'glm-4-long',
    ],
    requiresApiKey: true,
  },
  {
    id: 'moonshot',
    name: 'Moonshot AI',
    nameZh: '月之暗面',
    icon: '🌙',
    category: 'chinese',
    type: 'openai-compatible',
    defaultBaseURL: 'https://api.moonshot.cn/v1',
    apiKeyUrl: 'https://platform.moonshot.cn/console/api-keys',
    defaultModel: 'moonshot-v1-8k',
    models: [
      'moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k',
      'kimi-k2-thinking', 'kimi-k2.5',
    ],
    requiresApiKey: true,
  },
  {
    id: 'doubao',
    name: 'Doubao (ByteDance)',
    nameZh: '豆包',
    icon: '🫘',
    category: 'chinese',
    type: 'openai-compatible',
    defaultBaseURL: 'https://ark.cn-beijing.volces.com/api/v3',
    apiKeyUrl: 'https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey',
    defaultModel: 'doubao-pro-32k',
    models: [
      'doubao-pro-32k', 'doubao-pro-128k', 'doubao-pro-256k',
      'doubao-lite-32k', 'doubao-1-5-pro-32k', 'doubao-1-5-pro-256k',
    ],
    requiresApiKey: true,
  },
  {
    id: 'baichuan',
    name: 'Baichuan',
    nameZh: '百川智能',
    icon: '🏔️',
    category: 'chinese',
    type: 'openai-compatible',
    defaultBaseURL: 'https://api.baichuan-ai.com/v1',
    apiKeyUrl: 'https://platform.baichuan-ai.com/console/apikey',
    defaultModel: 'Baichuan4-Turbo',
    models: ['Baichuan4-Turbo', 'Baichuan4-Air', 'Baichuan4', 'Baichuan3-Turbo'],
    requiresApiKey: true,
  },
  {
    id: 'yi',
    name: 'Yi (01.AI)',
    nameZh: '零一万物',
    icon: '🦋',
    category: 'chinese',
    type: 'openai-compatible',
    defaultBaseURL: 'https://api.lingyiwanwu.com/v1',
    apiKeyUrl: 'https://platform.lingyiwanwu.com/apikeys',
    defaultModel: 'yi-large',
    models: ['yi-large', 'yi-large-turbo', 'yi-medium', 'yi-spark'],
    requiresApiKey: true,
  },
  {
    id: 'minimax',
    name: 'MiniMax',
    nameZh: '稀宇科技',
    icon: '🔷',
    category: 'chinese',
    type: 'openai-compatible',
    defaultBaseURL: 'https://api.minimax.chat/v1',
    apiKeyUrl: 'https://platform.minimaxi.com/user-center/basic-information/interface-key',
    defaultModel: 'MiniMax-M2.5',
    models: ['MiniMax-M2.5', 'MiniMax-M2.1', 'abab6.5s-chat'],
    requiresApiKey: true,
  },
  {
    id: 'siliconflow',
    name: 'SiliconFlow',
    nameZh: '硅基流动',
    icon: '🌊',
    category: 'chinese',
    type: 'openai-compatible',
    defaultBaseURL: 'https://api.siliconflow.cn/v1',
    apiKeyUrl: 'https://cloud.siliconflow.cn/account/ak',
    defaultModel: 'deepseek-ai/DeepSeek-V3',
    models: [
      'deepseek-ai/DeepSeek-V3',
      'deepseek-ai/DeepSeek-R1',
      'Qwen/Qwen3-235B-A22B',
      'Qwen/Qwen3-30B-A3B',
      'Qwen/Qwen2.5-72B-Instruct',
      'meta-llama/Meta-Llama-3.1-70B-Instruct',
    ],
    requiresApiKey: true,
  },
];

const LOCAL_PROVIDERS: ProviderDefinition[] = [
  {
    id: 'ollama',
    name: 'Ollama',
    nameZh: '本地模型',
    icon: '🦙',
    category: 'local',
    type: 'ollama',
    defaultBaseURL: 'http://localhost:11434',  // /v1 is appended in model-factory
    defaultModel: 'llama3.2',
    models: [],  // 从 Ollama API 动态获取
    requiresApiKey: false,
    description: 'Run AI models locally on your machine',
  },
  {
    id: 'lm-studio',
    name: 'LM Studio',
    nameZh: '本地模型',
    icon: '🖥️',
    category: 'local',
    type: 'openai-compatible',
    defaultBaseURL: 'http://localhost:1234/v1',
    defaultModel: 'local-model',
    models: [],  // 从 API 动态获取
    requiresApiKey: false,
    description: 'Discover, download, and run LLMs locally',
  },
];

// ============================================================
// Registry Class
// ============================================================

class ProviderRegistry {
  private providers: Map<string, ProviderDefinition> = new Map();
  private customProviders: ProviderDefinition[] = [];

  constructor() {
    // 注册所有内置 providers
    [...INTERNATIONAL_PROVIDERS, ...CHINESE_PROVIDERS, ...LOCAL_PROVIDERS].forEach(p => {
      this.providers.set(p.id, p);
    });
  }

  /** 获取所有 provider 定义 */
  getAll(): ProviderDefinition[] {
    return [...Array.from(this.providers.values()), ...this.customProviders];
  }

  /** 根据 ID 获取 */
  getById(id: string): ProviderDefinition | undefined {
    return this.providers.get(id) || this.customProviders.find(p => p.id === id);
  }

  /** 按类别获取 */
  getByCategory(category: ProviderCategory): ProviderDefinition[] {
    return this.getAll().filter(p => p.category === category);
  }

  /** 搜索 provider（支持中英文） */
  search(query: string): ProviderDefinition[] {
    if (!query.trim()) return this.getAll();
    const q = query.toLowerCase();
    return this.getAll().filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      (p.nameZh && p.nameZh.includes(q)) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
  }

  /** 添加自定义 provider */
  addCustomProvider(provider: ProviderDefinition): void {
    provider.category = 'custom';
    this.customProviders.push(provider);
  }

  /** 移除自定义 provider */
  removeCustomProvider(id: string): void {
    this.customProviders = this.customProviders.filter(p => p.id !== id);
  }

  /** 从存储加载自定义 providers */
  async loadCustomProviders(): Promise<void> {
    return new Promise<void>((resolve) => {
      chrome.storage.sync.get(['customProviders'], (result) => {
        if (result.customProviders && Array.isArray(result.customProviders)) {
          this.customProviders = result.customProviders;
        }
        resolve();
      });
    });
  }

  /** 保存自定义 providers 到存储 */
  async saveCustomProviders(): Promise<void> {
    return new Promise<void>((resolve) => {
      chrome.storage.sync.set({ customProviders: this.customProviders }, () => {
        resolve();
      });
    });
  }

  /** 获取所有类别 */
  getCategories(): { key: ProviderCategory; label: string; labelZh: string }[] {
    return [
      { key: 'international', label: 'International', labelZh: '国际' },
      { key: 'chinese', label: 'Chinese', labelZh: '国内' },
      { key: 'local', label: 'Local', labelZh: '本地' },
      { key: 'custom', label: 'Custom', labelZh: '自定义' },
    ];
  }
}

// 单例导出
export const providerRegistry = new ProviderRegistry();
export default providerRegistry;
