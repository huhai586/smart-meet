import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchAvailableModels,
  generateChatCompletion,
  testConnection,
} from './model-factory';

function createLocalStorage() {
  const data: Record<string, unknown> = {};
  return {
    data,
    get: vi.fn((keys: string[], callback: (result: Record<string, unknown>) => void) => {
      callback(Object.fromEntries(keys
        .filter((key) => key in data)
        .map((key) => [key, data[key]])));
    }),
    set: vi.fn((values: Record<string, unknown>, callback: () => void) => {
      Object.assign(data, values);
      callback();
    }),
  };
}

let localStorage: ReturnType<typeof createLocalStorage>;
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  localStorage = createLocalStorage();
  fetchMock = vi.fn();
  vi.stubGlobal('chrome', { storage: { local: localStorage } });
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
});

describe('fetchAvailableModels', () => {
  it('returns built-in models without an API key instead of sending a request', async () => {
    const result = await fetchAvailableModels('openai', {});

    expect(result.models).toContain('gpt-4o-mini');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns a fresh cached model list without calling the provider', async () => {
    localStorage.data.modelCache = {
      'openai:secret:': { models: ['cached-model'], fetchedAt: 1_700_000_000_000 },
    };

    await expect(fetchAvailableModels('openai', { apiKey: 'secret' }))
      .resolves.toEqual({ models: ['cached-model'], fromCache: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('filters and caches chat-capable models from OpenAI-compatible providers', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({
      data: [
        { id: 'gpt-4o-mini' },
        { id: 'text-embedding-3-small' },
        { id: 'claude-proxy' },
      ],
    }), { status: 200 }));

    await expect(fetchAvailableModels('openai', { apiKey: 'secret' }))
      .resolves.toEqual({ models: ['claude-proxy', 'gpt-4o-mini'] });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.openai.com/v1/models',
      { headers: { Authorization: 'Bearer secret' } },
    );
    expect(localStorage.data.modelCache).toMatchObject({
      'openai:secret:': { models: ['claude-proxy', 'gpt-4o-mini'] },
    });
  });

  it('returns a useful fallback and error when a forced refresh fails', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ error: { message: 'Invalid key' } }), {
      status: 401,
    }));

    const result = await fetchAvailableModels('openai', { apiKey: 'bad-key' }, { forceRefresh: true });

    expect(result.models).toContain('gpt-4o-mini');
    expect(result.error).toBe('Invalid key');
  });

  it('uses the Ollama endpoint and does not cache local model lists', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({
      models: [{ name: 'llama3.2:latest' }],
    }), { status: 200 }));

    await expect(fetchAvailableModels('ollama', { baseURL: 'http://localhost:11434/' }))
      .resolves.toEqual({ models: ['llama3.2:latest'] });
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:11434/api/tags');
    expect(localStorage.set).not.toHaveBeenCalled();
  });

  it('keeps only Gemini models that support generateContent', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({
      models: [
        { name: 'models/gemini-2.5-flash', supportedGenerationMethods: ['generateContent'] },
        { name: 'models/text-embedding-004', supportedGenerationMethods: ['embedContent'] },
      ],
    }), { status: 200 }));

    await expect(fetchAvailableModels('google-gemini', { apiKey: 'gemini-key' }))
      .resolves.toEqual({ models: ['gemini-2.5-flash'] });
  });

  it('reports unknown providers', async () => {
    await expect(fetchAvailableModels('missing-provider', {}))
      .resolves.toEqual({ models: [], error: 'Unknown provider' });
  });
});

describe('generateChatCompletion', () => {
  it('uses the OpenAI-compatible endpoint and returns its assistant message', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: 'hello from the provider' } }],
    }), { status: 200 }));

    await expect(generateChatCompletion('openai', { apiKey: 'key' }, [
      { role: 'user', content: 'hello' },
    ])).resolves.toBe('hello from the provider');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.openai.com/v1/chat/completions',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('turns an OpenAI-compatible error body into a useful exception', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ error: { message: 'Rate limited' } }), {
      status: 429,
    }));

    await expect(generateChatCompletion('openai', {}, [])).rejects.toThrow('Rate limited');
  });
});

describe('testConnection', () => {
  it('rejects unknown providers and missing required API keys before network access', async () => {
    await expect(testConnection('missing-provider', {}))
      .resolves.toEqual({ success: false, error: 'Unknown provider' });
    await expect(testConnection('openai', {}))
      .resolves.toEqual({ success: false, error: 'API key is required' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('maps a 401 provider response to an invalid-key result', async () => {
    fetchMock.mockResolvedValue(new Response('', { status: 401 }));

    await expect(testConnection('openai', { apiKey: 'bad-key' }))
      .resolves.toEqual({ success: false, error: 'Invalid API key' });
  });

  it('validates Anthropic key format without a network request', async () => {
    await expect(testConnection('anthropic', { apiKey: 'not-an-anthropic-key' }))
      .resolves.toEqual({ success: false, error: 'API key should start with sk-ant-' });
  });
});
