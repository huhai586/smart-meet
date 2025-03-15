/**
 * 在DOM中查找并高亮匹配的文本
 * @param container DOM容器
 * @param searchText 搜索文本
 * @returns 高亮元素数组
 */
export const findAndHighlightMatches = (
  container: HTMLElement | null,
  searchText: string
): HTMLElement[] => {
  if (!container || !searchText.trim()) {
    return [];
  }

  const results: HTMLElement[] = [];
  const searchRegex = new RegExp(searchText, 'gi');

  // 先移除之前的高亮
  const existingHighlights = container.querySelectorAll('.search-highlight');
  existingHighlights.forEach(el => {
    const parent = el.parentNode;
    if (parent) {
      parent.replaceChild(document.createTextNode(el.textContent || ''), el);
      // 合并相邻的文本节点
      parent.normalize();
    }
  });

  // 查找所有文本节点并高亮匹配项
  const textNodes: Node[] = [];
  const walk = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    { acceptNode: () => NodeFilter.FILTER_ACCEPT }
  );

  let node;
  while (node = walk.nextNode()) {
    if (node.nodeValue && node.nodeValue.trim() !== '') {
      textNodes.push(node);
    }
  }

  textNodes.forEach(textNode => {
    const content = textNode.nodeValue || '';
    const matches = content.match(searchRegex);

    if (matches) {
      let lastIndex = 0;
      searchRegex.lastIndex = 0;

      const fragments: Node[] = [];
      let match;

      while ((match = searchRegex.exec(content)) !== null) {
        // 添加匹配前的文本
        if (match.index > lastIndex) {
          fragments.push(document.createTextNode(
            content.substring(lastIndex, match.index)
          ));
        }

        // 创建高亮元素
        const highlightEl = document.createElement('span');
        highlightEl.className = 'search-highlight';
        highlightEl.textContent = match[0];
        fragments.push(highlightEl);

        // 记录匹配项位置
        results.push(highlightEl);

        lastIndex = searchRegex.lastIndex;
      }

      // 添加最后一个匹配后的文本
      if (lastIndex < content.length) {
        fragments.push(document.createTextNode(
          content.substring(lastIndex)
        ));
      }

      // 替换原始节点
      const parent = textNode.parentNode;
      if (parent) {
        fragments.forEach(fragment => {
          parent.insertBefore(fragment, textNode);
        });
        parent.removeChild(textNode);
      }
    }
  });

  return results;
};

/**
 * 清除所有搜索高亮
 * @param container DOM容器
 */
export const clearHighlights = (container: HTMLElement | null): void => {
  if (!container) return;

  const highlights = container.querySelectorAll('.search-highlight');
  highlights.forEach(el => {
    const parent = el.parentNode;
    if (parent) {
      parent.replaceChild(document.createTextNode(el.textContent || ''), el);
      parent.normalize();
    }
  });
};

/**
 * 滚动到指定匹配项并高亮
 * @param element 要滚动到的元素
 */
export const scrollToMatch = (element: HTMLElement): void => {
  if (!element) return;

  element.scrollIntoView({
    behavior: 'smooth',
    block: 'center'
  });

  // 添加活跃状态样式
  const activeHighlight = document.querySelector('.search-highlight-active');
  if (activeHighlight) {
    activeHighlight.classList.remove('search-highlight-active');
  }
  element.classList.add('search-highlight-active');
}; 