/**
 * Apple HIG System Colors — 10 entries, all pass WCAG AA with white text.
 * Assigned sequentially as new speakers are encountered (first-seen order).
 * Cycles back to the start if there are more than 10 speakers.
 *
 * Source: https://developer.apple.com/design/human-interface-guidelines/color
 */
const APPLE_PALETTE: string[] = [
  '#007AFF', // Blue
  '#FF3B30', // Red
  '#34C759', // Green
  '#FF9500', // Orange
  '#BF5AF2', // Purple
  '#FF2D55', // Pink
  '#5856D6', // Indigo
  '#00C7BE', // Mint
  '#30B0C7', // Teal
  '#32ADE6', // Cyan
  '#A2845E', // Brown
];

/**
 * Given the full list of all known speakers (preserving insertion/first-seen order),
 * assigns each a color from the Apple palette sequentially.
 * Returns a Map<speakerName, cssColor>.
 */
export function computeSpeakerColors(allSpeakers: string[]): Map<string, string> {
  const map = new Map<string, string>();
  allSpeakers.forEach((name, i) => {
    map.set(name, APPLE_PALETTE[i % APPLE_PALETTE.length]);
  });
  return map;
}
