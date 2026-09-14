const BLUESKY_IFRAME_TITLE = "Embedded Bluesky post";

export function addBlueskyIframeTitles(root: ParentNode): void {
  const untitledIframes = root.querySelectorAll<HTMLIFrameElement>("iframe[data-bluesky-id]:not([title])");

  for (const iframe of untitledIframes) {
    iframe.setAttribute("title", BLUESKY_IFRAME_TITLE);
  }
}
