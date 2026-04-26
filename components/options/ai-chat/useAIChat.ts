import { useState, useRef, useCallback, useEffect } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { getAllAIServiceConfigs, type AIServiceConfig } from '~utils/getAI';
import { generateChatCompletion } from '~utils/ai/model-factory';
import { getMultiDateTranscripts, buildMeetingContext } from '~utils/getMultiDateTranscripts';
import { providerRegistry } from '~utils/ai/provider-registry';

export interface ChatMsg {
  role: 'user' | 'assistant' | 'error';
  content: string;
  id: string;
}

export type LoadPhase = 'idle' | 'loading-context' | 'thinking';

export interface ConfiguredProvider {
  aiName: string;
  displayName: string;
  icon: string;
  modelName: string;
  isDefault: boolean;
}

export interface UseAIChatReturn {
  messages: ChatMsg[];
  dateRange: [Dayjs, Dayjs] | null;
  recordCount: number;
  loadPhase: LoadPhase;
  hasProvider: boolean;
  configuredProviders: ConfiguredProvider[];
  selectedProviderName: string;
  setSelectedProviderName: (name: string) => void;
  setDateRange: (range: [Dayjs, Dayjs] | null) => void;
  sendMessage: (text: string) => Promise<void>;
  clearMessages: () => void;
}

export function useAIChat(): UseAIChatReturn {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [dateRange, setDateRangeState] = useState<[Dayjs, Dayjs] | null>(null);
  const [recordCount, setRecordCount] = useState(0);
  const [loadPhase, setLoadPhase] = useState<LoadPhase>('idle');
  const [hasProvider, setHasProvider] = useState(true);
  const [configuredProviders, setConfiguredProviders] = useState<ConfiguredProvider[]>([]);
  const [selectedProviderName, setSelectedProviderName] = useState<string>('');

  // hold the built context string once loaded
  const contextRef = useRef<string>('');
  // hold the full conversation history for multi-turn
  const historyRef = useRef<{ role: 'system' | 'user' | 'assistant'; content: string }[]>([]);
  // store selected provider config for sendMessage (avoid stale closure)
  const selectedConfigRef = useRef<AIServiceConfig | null>(null);

  // Load configured providers on mount
  useEffect(() => {
    getAllAIServiceConfigs().then(aisConfig => {
      const providers: ConfiguredProvider[] = aisConfig.data.map(svc => {
        const def = providerRegistry.getById(svc.aiName);
        return {
          aiName: svc.aiName,
          displayName: def?.name ?? svc.aiName,
          icon: def?.icon ?? '🤖',
          modelName: svc.modelName,
          isDefault: svc.aiName === aisConfig.active,
        };
      });
      setConfiguredProviders(providers);
      if (providers.length > 0) {
        const defaultP = providers.find(p => p.isDefault) ?? providers[0];
        setSelectedProviderName(defaultP.aiName);
        selectedConfigRef.current = aisConfig.data.find(s => s.aiName === defaultP.aiName) ?? null;
        setHasProvider(true);
      } else {
        setHasProvider(false);
      }
    });
  }, []);

  // Keep selectedConfigRef in sync with selectedProviderName
  const handleSetSelectedProviderName = useCallback((name: string) => {
    setSelectedProviderName(name);
    getAllAIServiceConfigs().then(aisConfig => {
      selectedConfigRef.current = aisConfig.data.find(s => s.aiName === name) ?? null;
    });
  }, []);

  const setDateRange = useCallback(async (range: [Dayjs, Dayjs] | null) => {
    setDateRangeState(range);
    setMessages([]);
    historyRef.current = [];
    contextRef.current = '';
    setRecordCount(0);

    if (!range) return;

    // Load transcripts for range
    setLoadPhase('loading-context');
    try {
      const result = await getMultiDateTranscripts(range[0], range[1]);
      setRecordCount(result.totalRecords);
      const ctx = buildMeetingContext(result.transcripts, range[0], range[1]);
      contextRef.current = ctx;
      // Seed the system message
      historyRef.current = [{ role: 'system', content: ctx }];
    } finally {
      setLoadPhase('idle');
    }
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loadPhase !== 'idle') return;

    const svc = selectedConfigRef.current;
    if (!svc) {
      setHasProvider(false);
      return;
    }

    const userMsg: ChatMsg = { role: 'user', content: text, id: Date.now().toString() };
    setMessages(prev => [...prev, userMsg]);

    historyRef.current.push({ role: 'user', content: text });

    setLoadPhase('thinking');
    try {
      const reply = await generateChatCompletion(
        svc.aiName,
        {
          apiKey: svc.apiKey,
          baseURL: svc.baseUrl,
          modelName: svc.modelName,
        },
        historyRef.current,
      );

      historyRef.current.push({ role: 'assistant', content: reply });
      const aiMsg: ChatMsg = { role: 'assistant', content: reply, id: (Date.now() + 1).toString() };
      setMessages(prev => [...prev, aiMsg]);
    } catch (e) {
      const errMsg: ChatMsg = {
        role: 'error',
        content: e instanceof Error ? e.message : String(e),
        id: (Date.now() + 1).toString(),
      };
      setMessages(prev => [...prev, errMsg]);
      // Remove the failed user message from history
      historyRef.current.pop();
    } finally {
      setLoadPhase('idle');
    }
  }, [loadPhase]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    historyRef.current = contextRef.current
      ? [{ role: 'system', content: contextRef.current }]
      : [];
  }, []);

  return {
    messages, dateRange, recordCount, loadPhase, hasProvider,
    configuredProviders, selectedProviderName,
    setSelectedProviderName: handleSetSelectedProviderName,
    setDateRange, sendMessage, clearMessages,
  };
}
