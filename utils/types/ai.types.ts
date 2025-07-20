/**
 * AI service response and conversation types
 */

// Generic AI API response structure
export interface AIResponse {
  choices?: Array<{
    message?: {
      content: string;
      role?: string;
    };
    finish_reason?: string;
  }>;
  response?: {
    text: () => string;
  };
  text?: string;
  finish_reason?: string;
}

// OpenAI specific types
export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export type OpenAIConversation = OpenAIMessage[];

// Gemini specific types  
export interface GeminiChatSession {
  sendMessage: (prompt: string) => Promise<AIResponse>;
}

// XAI specific types
export interface XAIConversation {
  messages: OpenAIMessage[];
  addMessage: (message: OpenAIMessage) => XAIConversation;
  execute: () => Promise<AIResponse>;
  apiKey: string;
  model: string;
}

export interface XAIClient {
  apiKey: string;
  model: string;
  createCompletion: (prompt: string, options?: Record<string, unknown>) => Promise<AIResponse>;
  createConversation: () => XAIConversation;
}

// Storage provider interface
export interface StorageProvider {
  getDaysWithMessages: () => Promise<string[]>;
  getRecords: (date: unknown) => Promise<unknown[]>;
  restoreRecords: (content: unknown, date: unknown) => Promise<void>;
}

// Meeting transcript type
export interface MeetingTranscript {
  timestamp: number;
  meetingName: string;
  activeSpeaker?: string;
  talkContent?: string;
  [key: string]: unknown;
}

// Search result type
export interface SearchResult {
  id: string;
  text: string;
  timestamp: number;
  [key: string]: unknown;
}
