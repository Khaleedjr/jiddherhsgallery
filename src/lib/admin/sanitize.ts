/**
 * Descriptions are typed by the store owner, so this is a safety net rather
 * than a wall: keep simple formatting, drop anything that could run code.
 */
const ALLOWED = new Set(["p", "br", "strong", "b", "em", "i", "u", "h2", "h3", "h4", "ul", "ol", "li", "a", "blockquote"]);

const safeHref = (href: string) => {
  const value = href.trim().replace(/&amp;/g, "&");
  if (/^(https?:|mailto:|tel:|\/|#)/i.test(value)) return value.replace(/"/g, "&quot;");
  return null;
};

export function sanitizeHtml(html: string) {
  return html
    .replace(/<(script|style|iframe|object|embed|noscript|template)[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\/?([a-z][a-z0-9]*)\b([^>]*)>/gi, (match, rawTag: string, attrs: string) => {
      const tag = rawTag.toLowerCase();
      if (!ALLOWED.has(tag)) return "";
      if (match.startsWith("</")) return `</${tag}>`;
      if (tag === "a") {
        const href = /href\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(attrs);
        const url = href ? safeHref(href[2] ?? href[3] ?? href[4] ?? "") : null;
        return url ? `<a href="${url}" rel="noopener">` : "<a>";
      }
      return tag === "br" ? "<br />" : `<${tag}>`;
    })
    .trim();
}
