const NON_CHAT_PATTERNS = [
  /embedding/i,
  /^tts-/i,
  /^whisper/i,
  /^dall-e/i,
  /moderation/i,
  /^text-davinci/i,
  /^text-curie/i,
  /^text-babbage/i,
  /^text-ada/i,
  /^davinci(?!-002-finetuned)/i,
  /^babbage/i,
  /^curie/i,
  /^ada(?!-)/i,
  /^code-davinci/i,
  /^code-cushman/i,
  /^if-/i,
  /realtime/i,
  /audio/i,
  /^computer-use/i,
];

export function isChatModel(modelId: string): boolean {
  return !NON_CHAT_PATTERNS.some((pattern) => pattern.test(modelId));
}

export function filterChatModelIds(modelIds: string[]): string[] {
  return modelIds.filter(isChatModel).sort();
}
