// WordPress list posts number each entry's heading, e.g. "<h2>10. The Railway, Teddington</h2>".
const NUMBERED_HEADING = /<h[23][^>]*>\s*\d+\.\s/g;

// Links into our own posts point at the WordPress host, which costs readers two redirects per click.
const INTERNAL_LINK = /href="https?:\/\/(?:blog\.|www\.)?rdldn\.co\.uk\/(?!wp-content\/)/g;

export const rewriteInternalLinks = (html: string): string => html.replace(INTERNAL_LINK, 'href="/');

/**
 * Splits post HTML just before the numbered headings at the given 1-based positions,
 * so blocks can be rendered between list entries. Returns null if the post has too few entries.
 */
export const splitBeforeNumberedHeadings = (html: string, positions: number[]): string[] | null => {
  const headingStarts = [...html.matchAll(NUMBERED_HEADING)].map((match) => match.index);
  if (positions.some((position) => position < 1 || position > headingStarts.length)) return null;

  const cuts = positions.map((position) => headingStarts[position - 1]);
  return [0, ...cuts].map((start, index) => html.slice(start, cuts[index]));
};
