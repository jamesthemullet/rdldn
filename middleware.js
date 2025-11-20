export function middleware(req) {
  const ua = req.headers.get("user-agent") || "";

  // Block worst offenders (example list)
  const badBots = [
    "Bytespider", "AhrefsBot", "SemrushBot", "MJ12bot",
    "dotbot", "PetalBot", "Crawlers", "Python-requests"
  ];

  if (badBots.some((bot) => ua.includes(bot))) {
    return new Response("Blocked", { status: 403 });
  }
}