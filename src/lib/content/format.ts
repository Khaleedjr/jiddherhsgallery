/** Fills {name} placeholders; unknown names are left as typed, so a later fill can still use them. */
export function fill(template: string, vars: Record<string, string | number | null | undefined>) {
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = vars[name];
    return value === undefined || value === null ? match : String(value);
  });
}

export type RichBlock = { kind: "p"; lines: string[] } | { kind: "ul"; items: string[] };

const BULLET = /^\s*[-•]\s+(.*)$/;

/**
 * The editor's light formatting: a blank line starts a new paragraph, lines
 * starting "- " are bullet points, and single line breaks stay as typed.
 */
export function parseRich(text: string): RichBlock[] {
  const blocks: RichBlock[] = [];
  for (const chunk of text.replace(/\r\n?/g, "\n").split(/\n[ \t]*\n/)) {
    let lines: string[] = [];
    let items: string[] = [];
    const flushLines = () => {
      if (lines.length) blocks.push({ kind: "p", lines });
      lines = [];
    };
    const flushItems = () => {
      if (items.length) blocks.push({ kind: "ul", items });
      items = [];
    };
    for (const raw of chunk.split("\n")) {
      if (!raw.trim()) continue;
      const bullet = raw.match(BULLET);
      if (bullet) {
        flushLines();
        items.push(bullet[1].trim());
      } else {
        flushItems();
        lines.push(raw.trim());
      }
    }
    flushLines();
    flushItems();
  }
  return blocks;
}

/** The same text without formatting marks, for search engines and link previews. */
export function plainText(text: string) {
  return parseRich(text)
    .map((block) => (block.kind === "p" ? block.lines.join(" ") : block.items.join(" ")))
    .join(" ")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export const whatsappHref = (number: string, message: string) => `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
