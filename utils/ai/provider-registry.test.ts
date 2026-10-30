import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ProviderRegistry,
  type ProviderDefinition,
} from './provider-registry';

const customProvider: ProviderDefinition = {
  id: 'custom-test',
  name: 'Test provider',
  icon: '🧪',
  category: 'international',
  type: 'openai-compatible',
  defaultBaseURL: 'https://example.test/v1',
  defaultModel: 'test-model',
  models: ['test-model'],
  requiresApiKey: true,
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ProviderRegistry', () => {
  it('returns known built-in providers and groups them by category', () => {
    const registry = new ProviderRegistry();

    expect(registry.getById('openai')).toMatchObject({
      type: 'openai-compatible',
      defaultModel: 'gpt-4o-mini',
    });
    expect(registry.getByCategory('local').map((provider) => provider.id))
      .toEqual(expect.arrayContaining(['ollama', 'lm-studio']));
  });

  it('searches provider name, id, Chinese name, and description case-insensitively', () => {
    const registry = new ProviderRegistry();

    expect(registry.search('GROQ').map((provider) => provider.id)).toContain('groq');
    expect(registry.search('深度求索').map((provider) => provider.id)).toContain('deepseek');
    expect(registry.search('locally').map((provider) => provider.id)).toContain('ollama');
  });

  it('adds a copy of a custom provider and forces its category without mutating the caller', () => {
    const registry = new ProviderRegistry();
    registry.addCustomProvider(customProvider);

    expect(customProvider.category).toBe('international');
    expect(registry.getById('custom-test')).toMatchObject({ category: 'custom' });
    expect(registry.getByCategory('custom')).toHaveLength(1);

    registry.removeCustomProvider('custom-test');
    expect(registry.getById('custom-test')).toBeUndefined();
  });

  it('loads and saves custom providers through Chrome sync storage', async () => {
    const get = vi.fn((_keys: string[], callback: (value: object) => void) => {
      callback({ customProviders: [{ ...customProvider, category: 'custom' }] });
    });
    const set = vi.fn((_value: object, callback: () => void) => callback());
    vi.stubGlobal('chrome', { storage: { sync: { get, set } } });

    const registry = new ProviderRegistry();
    await registry.loadCustomProviders();
    await registry.saveCustomProviders();

    expect(registry.getById('custom-test')).toMatchObject({ category: 'custom' });
    expect(set).toHaveBeenCalledWith(
      { customProviders: [{ ...customProvider, category: 'custom' }] },
      expect.any(Function),
    );
  });
});
