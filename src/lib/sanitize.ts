import sanitizeHtml from "sanitize-html";

const contentOptions: sanitizeHtml.IOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "figure", "figcaption", "iframe"]),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    img: ["src", "srcset", "alt", "width", "height", "loading", "class"],
    iframe: ["src", "width", "height", "allowfullscreen", "frameborder", "title"],
    "*": ["class", "id"],
  },
  allowedSchemes: ["http", "https", "mailto"],
};

export const sanitizeContent = (html: string | null | undefined): string =>
  sanitizeHtml(html ?? "", contentOptions);

export const sanitizeTitle = (html: string | null | undefined): string =>
  sanitizeHtml(html ?? "", { allowedTags: [], allowedAttributes: {} });
