export function renderHighlightedHtml(content: string, highlights: string[] = []): string {
  if (!content) return '';
  return highlights.reduce((acc, h) => {
    if (!h) return acc;
    const escaped = h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'g');
    return acc.replace(regex, `<span class="highlight">${h}</span>`);
  }, content);
}


