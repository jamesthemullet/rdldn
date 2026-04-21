import { describe, expect, test } from "vitest";
import { middleware } from "../middleware.js";

const makeRequest = (userAgent: string): Request =>
	new Request("http://localhost/", {
		headers: { "user-agent": userAgent },
	});

describe("middleware", () => {
	test.each([
		["Bytespider", "Mozilla/5.0 (compatible; Bytespider; spider-feedback@bytedance.com)"],
		["AhrefsBot", "Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)"],
		["SemrushBot", "Mozilla/5.0 (compatible; SemrushBot-SA/0.97; +http://www.semrush.com/bot.html)"],
		["MJ12bot", "Mozilla/5.0 (compatible; MJ12bot/v1.4.8; http://mj12bot.com/)"],
		["dotbot", "Mozilla/5.0 (compatible; dotbot/1.0; http://www.opensiteexplorer.org/dotbot)"],
		["PetalBot", "Mozilla/5.0 (compatible; PetalBot; +https://aspiegel.com/petalbot)"],
		["Crawlers", "Mozilla/5.0 (compatible; Crawlers/1.0)"],
		["Python-requests", "Python-requests/2.28.0"],
	])("blocks %s user agent with 403", async (_botName, userAgent) => {
		const response = middleware(makeRequest(userAgent));
		expect(response).toBeInstanceOf(Response);
		expect(response?.status).toBe(403);
		const text = await response!.text();
		expect(text).toBe("Blocked");
	});

	test.each([
		["Chrome browser", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"],
		["Googlebot", "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"],
		["curl", "curl/7.68.0"],
		["empty string", ""],
	])("allows %s user agent", (_label, userAgent) => {
		const response = middleware(makeRequest(userAgent));
		expect(response).toBeUndefined();
	});

	test("blocks when bot string appears in the middle of a user agent", () => {
		const response = middleware(makeRequest("Custom AhrefsBot 2.0 spider"));
		expect(response?.status).toBe(403);
	});
});
