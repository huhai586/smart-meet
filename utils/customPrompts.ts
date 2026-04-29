import { getConfigValue, setConfigValue } from '~/utils/appConfig';

export interface CustomPrompt {
  id: string;
  title: string;
  content: string;
}

export async function getCustomPrompts(): Promise<CustomPrompt[]> {
  const v = await getConfigValue('customPrompts');
  return v ?? [];
}

export async function saveCustomPrompts(prompts: CustomPrompt[]): Promise<void> {
  await setConfigValue('customPrompts', prompts);
}

export function generatePromptId(): string {
  return `prompt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}
