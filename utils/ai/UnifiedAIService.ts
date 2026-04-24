/**
 * Unified AI Service
 * 使用原生 SDK（openai / @google/generative-ai / @anthropic-ai/sdk）统一实现
 */
import { generateChatCompletion, type ModelConfig, type ChatMessage } from './model-factory';
import { getCurrentUILanguage } from '../../hooks/useUILanguage';
import { getTranslation } from '../i18n';
import getMeetingCaptions from '../getCaptions';
import type { Dayjs } from 'dayjs';

export interface IAIService {
  init(): void;
  isReady(): boolean;
  initConversation(mode: string, date: Dayjs): Promise<void>;
  getConversation(mode: string, date: Dayjs): Promise<ChatMessage[]>;
  clearConversation(mode: string): void;
  generateResponse(options: GenerateResponseOptions): Promise<string>;
  getServiceName(): string;
}

export interface GenerateResponseOptions {
  prompt: string;
  mode?: string;
  useContext?: boolean;
  date: Dayjs;
}

export class UnifiedAIService implements IAIService {
  private conversations: Record<string, ChatMessage[]> = {};
  private providerId: string;
  private config: ModelConfig;
  private initialized = false;

  constructor(providerId: string, config: ModelConfig) {
    this.providerId = providerId;
    this.config = config;
  }

  init(): void {
    this.conversations = {};
    this.initialized = true;
    console.log(`AI service initialized: ${this.providerId}`);
  }

  isReady(): boolean {
    return this.initialized;
  }

  async initConversation(mode: string, date: Dayjs): Promise<void> {
    if (!this.isReady()) return;

    try {
      const meetingContent = await getMeetingCaptions(date);
      const currentUILanguage = await getCurrentUILanguage();
      const langCode = currentUILanguage.code;

      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: getTranslation('ai_system_prompt_meeting', langCode),
        },
        {
          role: 'user',
          content: `${getTranslation('ai_meeting_content_intro', langCode)}${JSON.stringify(meetingContent)}`,
        },
        {
          role: 'assistant',
          content: getTranslation('ai_meeting_assistant_ready', langCode),
        },
      ];

      this.conversations[mode] = messages;
      console.log(`Conversation for ${mode} initialized (${this.providerId})`);
    } catch (error) {
      console.error(`Error initializing conversation: ${error}`);
    }
  }

  async getConversation(mode: string, date: Dayjs): Promise<ChatMessage[]> {
    if (!this.conversations[mode]) {
      await this.initConversation(mode, date);
    }
    return this.conversations[mode] || [];
  }

  clearConversation(mode: string): void {
    delete this.conversations[mode];
  }

  async generateResponse(options: GenerateResponseOptions): Promise<string> {
    const { prompt, mode, useContext, date } = options;

    if (!this.isReady()) {
      throw new Error(`${this.providerId} AI service not ready`);
    }

    if (useContext && mode) {
      const conversation = await this.getConversation(mode, date);
      conversation.push({ role: 'user', content: prompt });

      try {
        const text = await generateChatCompletion(this.providerId, this.config, conversation);
        conversation.push({ role: 'assistant', content: text });
        return text;
      } catch (error) {
        console.error(`Error with ${this.providerId} conversation:`, error);
        // 重试：重新初始化对话
        await this.initConversation(mode, date);
        const fresh = await this.getConversation(mode, date);
        fresh.push({ role: 'user', content: prompt });
        const text = await generateChatCompletion(this.providerId, this.config, fresh);
        fresh.push({ role: 'assistant', content: text });
        return text;
      }
    }

    // 无上下文模式
    return generateChatCompletion(this.providerId, this.config, [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: prompt },
    ]);
  }

  getServiceName(): string {
    return this.providerId;
  }
}
