export interface CustomPrompt {
  id: string;
  title: string;
  content: string;
}

const STORAGE_KEY = 'customPrompts';

export async function getCustomPrompts(): Promise<CustomPrompt[]> {
  return new Promise((resolve) => {
    chrome.storage.sync.get([STORAGE_KEY], (result) => {
      resolve(result[STORAGE_KEY] ?? []);
    });
  });
}

export async function saveCustomPrompts(prompts: CustomPrompt[]): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ [STORAGE_KEY]: prompts }, resolve);
  });
}

export function generatePromptId(): string {
  return `prompt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}
