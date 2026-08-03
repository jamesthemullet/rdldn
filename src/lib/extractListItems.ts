const TAG_PATTERN = /<[^>]+>/g;
const LIST_ITEM_PATTERN = /<li[^>]*>([\s\S]*?)<\/li>/gi;
const PARAGRAPH_PATTERN = /<p[^>]*>([\s\S]*?)<\/p>/gi;
const HAS_BREAK_PATTERN = /<br\s*\/?>/i;
const BREAK_SPLIT_PATTERN = /<br\s*\/?>/gi;

const MIN_LINE_BREAK_ITEMS = 3;

const ENTITY_PATTERN = /&amp;|&lt;|&gt;|&quot;|&#0?39;|&apos;|&nbsp;/g;
const ENTITY_MAP: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&#039;": "'",
  "&apos;": "'",
  "&nbsp;": " "
};

const decodeEntities = (text: string): string =>
  text.replace(ENTITY_PATTERN, (match) => ENTITY_MAP[match] ?? match);

const cleanText = (raw: string): string =>
  decodeEntities(raw.replace(TAG_PATTERN, " "))
    .replace(/\s+/g, " ")
    .trim();

const extractFromListItems = (html: string): string[] => {
  const matches = html.match(LIST_ITEM_PATTERN) ?? [];

  return matches
    .map((li) => li.replace(/^<li[^>]*>/i, "").replace(/<\/li>$/i, ""))
    .map(cleanText)
    .filter((text) => text.length > 0);
};

const extractFromLineBreakParagraphs = (html: string): string[] => {
  const paragraphs = html.match(PARAGRAPH_PATTERN) ?? [];

  return paragraphs
    .filter((paragraph) => HAS_BREAK_PATTERN.test(paragraph))
    .flatMap((paragraph) => paragraph.split(BREAK_SPLIT_PATTERN))
    .map(cleanText)
    .filter((text) => text.length > 0);
};

export const extractListItems = (html: string): string[] => {
  const listItems = extractFromListItems(html);
  if (listItems.length > 0) return listItems;

  const lineBreakItems = extractFromLineBreakParagraphs(html);
  return lineBreakItems.length >= MIN_LINE_BREAK_ITEMS ? lineBreakItems : [];
};
