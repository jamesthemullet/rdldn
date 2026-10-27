export const HAUNTED_TITLES = [
  "🕯️ come back…",
  "the yorkshires are hungry",
  "🦴 we saved you a seat",
  "don't let the gravy go cold…",
];

const SECRET_WORDS = ["boo", "gravy"];
export const DEMON_RATING = "6.66";
export const GLITCH_TEXT = "IT WAS UNDERCOOKED";

const MAX_SECRET_WORD_LENGTH = Math.max(...SECRET_WORDS.map((word) => word.length));

export function pickHauntedTitle(random: () => number = Math.random): string {
  return HAUNTED_TITLES[Math.floor(random() * HAUNTED_TITLES.length)];
}

// Appends a key to the rolling buffer and reports whether it now ends with a secret word.
export function pushSecretKey(buffer: string, key: string): { buffer: string; matched: boolean } {
  if (key.length !== 1) return { buffer, matched: false };

  const next = (buffer + key.toLowerCase()).slice(-MAX_SECRET_WORD_LENGTH);
  const matched = SECRET_WORDS.some((word) => next.endsWith(word));

  return { buffer: matched ? "" : next, matched };
}

export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

// Wraps the first `limit` occurrences of "gravy" in post text so CSS can make them drip.
export function wrapGravyWords(root: Element, limit = 5): number {
  const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) =>
      node.parentElement?.closest("script, style, .haunted-gravy") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
  });

  const textNodes: Text[] = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode as Text);

  let wrapped = 0;
  for (const textNode of textNodes) {
    if (wrapped >= limit) break;

    let current: Text = textNode;
    let match = /gravy/i.exec(current.data);
    while (match && wrapped < limit) {
      const gravyNode = current.splitText(match.index);
      current = gravyNode.splitText(match[0].length);

      const span = root.ownerDocument.createElement("span");
      span.className = "haunted-gravy";
      gravyNode.replaceWith(span);
      span.append(gravyNode);

      wrapped++;
      match = /gravy/i.exec(current.data);
    }
  }

  return wrapped;
}

export function hasScrolledPast(fraction: number, scrollY: number, viewportHeight: number, pageHeight: number): boolean {
  return pageHeight > 0 && (scrollY + viewportHeight) / pageHeight >= fraction;
}
