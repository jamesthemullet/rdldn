const TAG_PATTERN = /<[^>]+>/g;
const LIST_ITEM_PATTERN = /<li[^>]*>([\s\S]*?)<\/li>/gi;

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

export const extractListItems = (html: string): string[] => {
  const matches = html.match(LIST_ITEM_PATTERN) ?? [];

  return matches
    .map((li) => li.replace(/^<li[^>]*>/i, "").replace(/<\/li>$/i, ""))
    .map((inner) => decodeEntities(inner.replace(TAG_PATTERN, " ")))
    .map((text) => text.replace(/\s+/g, " ").trim())
    .filter((text) => text.length > 0);
};
