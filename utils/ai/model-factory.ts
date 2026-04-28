/// <reference types="chrome"/>
/**
 * AI Caller
 * 使用原生 SDK 直接调用各 AI 服务商，无需 Vercel AI SDK
 * - openai@4.x：OpenAI / 所有 OpenAI-compatible（DeepSeek、Grok、Qwen 等）/ Ollama
 * - @google/generative-ai：Google Gemini
 * - @anthropic-ai/sdk：Anthropic Claude
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
import { providerRegistry } from './provider-registry';

export interface ModelConfig {
  apiKey?: string;
  baseURL?: string;
  modelName?: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// ============================================================
// 核心调用函数
// ============================================================

/**
 * 根据 provider 类型调用相应 SDK，返回文本响应
 */
export async function generateChatCompletion(
  providerId: string,
  config: ModelConfig,
  messages: ChatMessage[]
): Promise<string> {
  const provider = providerRegistry.getById(providerId);
  if (!provider) throw new Error(`Unknown provider: ${providerId}`);

  const modelName = config.modelName || provider.defaultModel;

  switch (provider.type) {
    case 'openai-compatible': {
      const baseURL = (config.baseURL || provider.defaultBaseURL).replace(/\/$/, '');
      const resp = await fetch(`${baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey || 'no-key'}`,
        },
        body: JSON.stringify({ model: modelName, messages }),
      });
      if (!resp.ok) {
        let errMsg = `HTTP ${resp.status}`;
        try {
          const errData = await resp.json();
          errMsg = errData?.error?.message || errData?.message || errMsg;
        } catch { /* ignore */ }
        throw new Error(errMsg);
      }
      const data = await resp.json();
      return data.choices?.[0]?.message?.content || '';
    }

    case 'ollama': {
      const baseURL = (config.baseURL || provider.defaultBaseURL).replace(/\/$/, '') + '/v1';
      const resp = await fetch(`${baseURL}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: modelName, messages }),
      });
      if (!resp.ok) {
        let errMsg = `HTTP ${resp.status}`;
        try {
          const errData = await resp.json();
          errMsg = errData?.error?.message || errData?.message || errMsg;
        } catch { /* ignore */ }
        throw new Error(errMsg);
      }
      const data = await resp.json();
      return data.choices?.[0]?.message?.content || '';
    }

    case 'google': {
      const genAI = new GoogleGenerativeAI(config.apiKey || '');
      const systemMsg = messages.find(m => m.role === 'system');
      const genModel = genAI.getGenerativeModel({
        model: modelName,
        ...(systemMsg ? { systemInstruction: systemMsg.content } : {}),
      });
      const chatMsgs = messages.filter(m => m.role !== 'system');
      const lastMsg = chatMsgs[chatMsgs.length - 1];
      const history = chatMsgs.slice(0, -1).map(m => ({
        role: m.role === 'assistant' ? 'model' as const : 'user' as const,
        parts: [{ text: m.content }],
      }));
      const chat = genModel.startChat({ history });
      const result = await chat.sendMessage(lastMsg?.content || '');
      return result.response.text();
    }

    case 'anthropic': {
      const client = new Anthropic({
        apiKey: config.apiKey || '',
        dangerouslyAllowBrowser: true,
      });
      const systemMsg = messages.find(m => m.role === 'system');
      const chatMsgs = messages.filter(m => m.role !== 'system');
      const resp = await client.messages.create({
        model: modelName,
        max_tokens: 4096,
        ...(systemMsg ? { system: systemMsg.content } : {}),
        messages: chatMsgs.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      });
      const block = resp.content[0];
      return block.type === 'text' ? block.text : '';
    }

    default:
      throw new Error(`Unsupported provider type: ${(provider as { type: string }).type}`);
  }
}

// ============================================================
// 连接测试
// ============================================================

export async function testConnection(
  providerId: string,
  config: ModelConfig
): Promise<{ success: boolean; error?: string }> {
  const provider = providerRegistry.getById(providerId);
  if (!provider) return { success: false, error: 'Unknown provider' };

  if (provider.requiresApiKey && !config.apiKey) {
    return { success: false, error: 'API key is required' };
  }

  try {
    if (provider.type === 'ollama') {
      const baseURL = (config.baseURL || provider.defaultBaseURL).replace(/\/$/, '');
      const resp = await fetch(`${baseURL}/api/tags`);
      if (!resp.ok) return { success: false, error: `Ollama not reachable at ${baseURL}` };
      return { success: true };
    }

    if (provider.type === 'google') {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${config.apiKey}`
      );
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        return { success: false, error: err?.error?.message || 'Invalid API key' };
      }
      return { success: true };
    }

    if (provider.type === 'anthropic') {
      if (!config.apiKey?.startsWith('sk-ant-')) {
        return { success: false, error: 'API key should start with sk-ant-' };
      }
      return { success: true };
    }

    const baseURL = (config.baseURL || provider.defaultBaseURL).replace(/\/$/, '');
    const resp = await fetch(`${baseURL}/models`, {
      headers: { 'Authorization': `Bearer ${config.apiKey}` },
    });
    if (resp.status === 401) return { success: false, error: 'Invalid API key' };
    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message || 'Connection failed' };
  }
}

// ============================================================
// 聊天模型过滤（过滤掉 embedding / TTS / 图像 / 语音 等非对话模型）
// ============================================================

const NON_CHAT_PATTERNS = [
  /embedding/i,           // text-embedding-*, *-embed-*
  /^tts-/i,               // tts-1, tts-1-hd
  /^whisper/i,            // whisper-1
  /^dall-e/i,             // dall-e-2, dall-e-3
  /moderation/i,          // omni-moderation-*, text-moderation-*
  /^text-davinci/i,       // text-davinci-002/003（旧 completion 模型）
  /^text-curie/i,
  /^text-babbage/i,
  /^text-ada/i,
  /^davinci(?!-002-finetuned)/i, // 旧 base 模型（但保留 fine-tune）
  /^babbage/i,
  /^curie/i,
  /^ada(?!-)/i,           // ada 本身，但保留 ada-002（embedding 已被上面过滤）
  /^code-davinci/i,       // code-davinci-001/002
  /^code-cushman/i,
  /^if-/i,                // if-davinci-* 指令微调旧模型
  /realtime/i,            // gpt-4o-realtime-preview（语音实时模型）
  /audio/i,               // gpt-4o-audio-preview
  /^computer-use/i,
];

/**
 * 判断模型 ID 是否为对话（chat completion）模型
 */
function isChatModel(id: string): boolean {
  return !NON_CHAT_PATTERNS.some(pattern => pattern.test(id));
}

// ============================================================
// 模型列表缓存（TTL 24h，存 chrome.storage.local）
// ============================================================

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 小时

interface ModelCache {
  models: string[];
  fetchedAt: number;
}

async function readModelCache(cacheKey: string): Promise<ModelCache | null> {
  return new Promise(resolve => {
    chrome.storage.sync.get(['modelCache'], result => {
      const cache = result.modelCache || {};
      const entry: ModelCache | undefined = cache[cacheKey];
      if (entry && Date.now() - entry.fetchedAt < CACHE_TTL_MS) {
        resolve(entry);
      } else {
        resolve(null);
      }
    });
  });
}

async function writeModelCache(cacheKey: string, models: string[]): Promise<void> {
  return new Promise(resolve => {
    chrome.storage.sync.get(['modelCache'], result => {
      const cache = result.modelCache || {};
      cache[cacheKey] = { models, fetchedAt: Date.now() } satisfies ModelCache;
      chrome.storage.sync.set({ modelCache: cache }, resolve);
    });
  });
}

// ============================================================
// 获取可用模型列表
// ============================================================

export async function fetchAvailableModels(
  providerId: string,
  config: ModelConfig,
  options: { forceRefresh?: boolean } = {}
): Promise<{ models: string[]; fromCache?: boolean; error?: string }> {
  const provider = providerRegistry.getById(providerId);
  if (!provider) return { models: [], error: 'Unknown provider' };

  // Ollama：不缓存，每次实时拉取本地列表
  if (provider.type === 'ollama') {
    try {
      const baseURL = (config.baseURL || provider.defaultBaseURL).replace(/\/$/, '');
      const resp = await fetch(`${baseURL}/api/tags`);
      if (resp.ok) {
        const data = await resp.json();
        return { models: (data.models || []).map((m: { name: string }) => m.name) };
      }
      return { models: [], error: 'Cannot connect to Ollama' };
    } catch {
      return { models: [], error: 'Ollama not running' };
    }
  }

  // 无 API Key 且非强制刷新：直接返回预定义列表（避免无意义请求）
  // forceRefresh 时放行，让 SDK 返回真实错误，给用户明确提示
  if (provider.requiresApiKey && !config.apiKey && !options.forceRefresh) {
    return { models: [...provider.models] };
  }

  const cacheKey = `${providerId}:${config.apiKey?.slice(-8)}:${config.baseURL || ''}`;

  // 读缓存
  if (!options.forceRefresh) {
    const cached = await readModelCache(cacheKey);
    if (cached) {
      return { models: cached.models, fromCache: true };
    }
  }

  // Google Gemini：专用 REST API，过滤支持 generateContent 的模型
  if (provider.type === 'google') {
    try {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${config.apiKey}&pageSize=100`
      );
      if (resp.ok) {
        const data = await resp.json();
        const models: string[] = (data.models || [])
          .filter((m: { supportedGenerationMethods?: string[]; name: string }) =>
            m.supportedGenerationMethods?.includes('generateContent')
          )
          .map((m: { name: string }) => m.name.replace('models/', ''))
          .sort();
        if (models.length > 0) {
          await writeModelCache(cacheKey, models);
          return { models };
        }
      } else {
        // 非 2xx：尝试解析错误体
        let errMsg = `HTTP ${resp.status}`;
        try {
          const errData = await resp.json();
          errMsg = errData?.error?.message || errData?.error || errMsg;
        } catch { /* ignore parse error */ }
        if (options.forceRefresh) return { models: [...provider.models], error: errMsg };
      }
    } catch (e) {
      if (options.forceRefresh) {
        const msg = e instanceof Error ? e.message : String(e);
        return { models: [...provider.models], error: msg };
      }
    }
    return { models: [...provider.models] };
  }

  // OpenAI-compatible：直接 fetch /models，手动带 Authorization 头
  // （浏览器扩展环境中 OpenAI SDK 有时不正确地附加鉴权头，故统一用 fetch）
  if (provider.type === 'openai-compatible') {
    try {
      const baseURL = (config.baseURL || provider.defaultBaseURL).replace(/\/$/, '');
      const resp = await fetch(`${baseURL}/models`, {
        headers: { 'Authorization': `Bearer ${config.apiKey || 'no-key'}` },
      });
      if (!resp.ok) {
        let errMsg = `HTTP ${resp.status}`;
        try {
          const errData = await resp.json();
          errMsg = errData?.error?.message || errData?.message || errMsg;
        } catch { /* ignore */ }
        if (options.forceRefresh) return { models: [...provider.models], error: errMsg };
      } else {
        const data = await resp.json();
        const rawList: { id: string }[] = Array.isArray(data) ? data : (data.data ?? []);
        const models = rawList.map(m => m.id).filter(isChatModel).sort();
        if (models.length > 0) {
          await writeModelCache(cacheKey, models);
          return { models };
        }
      }
    } catch (e) {
      if (options.forceRefresh) {
        const msg = e instanceof Error ? e.message : String(e);
        return { models: [...provider.models], error: msg };
      }
    }
  }

  // Anthropic 及其他：无公开 models 端点，使用预定义列表
  return { models: [...provider.models] };
}
