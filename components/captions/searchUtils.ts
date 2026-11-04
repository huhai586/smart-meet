/**
 * Search highlighting uses the CSS Custom Highlight API: matches are Range objects painted via
 * ::highlight(), so the caption DOM (owned by React and updated while captions stream in) is
 * never modified. Wrapping matches in <span>s made React's removeChild throw and crash the panel.
 */
const SEARCH_HIGHLIGHT = 'search-highlight';
const SEARCH_HIGHLIGHT_ACTIVE = 'search-highlight-active';

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * 在DOM中查找匹配的文本并高亮（不修改 DOM）
 * @param container DOM容器
 * @param searchText 搜索文本
 * @returns 匹配范围数组
 */
export const findAndHighlightMatches = (
  container: HTMLElement | null,
  searchText: string
): Range[] => {
  clearHighlights();
  if (!container || !searchText.trim()) {
    return [];
  }

  const results: Range[] = [];
  const searchRegex = new RegExp(escapeRegExp(searchText), 'gi');

  const walk = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walk.nextNode())) {
    const content = node.nodeValue || '';
    searchRegex.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = searchRegex.exec(content)) !== null) {
      if (match[0].length === 0) {
        searchRegex.lastIndex++;
        continue;
      }
      const range = new Range();
      range.setStart(node, match.index);
      range.setEnd(node, match.index + match[0].length);
      results.push(range);
    }
  }

  if (results.length > 0) {
    CSS.highlights.set(SEARCH_HIGHLIGHT, new Highlight(...results));
  }
  return results;
};

/**
 * 清除所有搜索高亮
 */
export const clearHighlights = (): void => {
  CSS.highlights.delete(SEARCH_HIGHLIGHT);
  CSS.highlights.delete(SEARCH_HIGHLIGHT_ACTIVE);
};

/**
 * 滚动到指定匹配项并标记为当前项
 * @param range 要滚动到的匹配范围
 */
export const scrollToMatch = (range: Range): void => {
  if (!range) return;
  const element = range.startContainer.parentElement;
  if (!element) return;

  // Off-screen captions are placeholders (content-visibility) with an estimated height, so a
  // single smooth scroll can land short. Jump to the caption first so it renders at its real
  // size, then glide to the exact match. 'instant' because the list's CSS is scroll-behavior: smooth.
  element.closest('.caption-container')?.scrollIntoView({ behavior: 'instant', block: 'center' });
  element.scrollIntoView({
    behavior: 'smooth',
    block: 'center'
  });

  const active = new Highlight(range);
  // `priority` is missing from the bundled DOM typings.
  (active as Highlight & { priority: number }).priority = 1;
  CSS.highlights.set(SEARCH_HIGHLIGHT_ACTIVE, active);
};
