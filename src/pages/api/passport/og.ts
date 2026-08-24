import { ImageResponse } from "@vercel/og";
import type { APIContext } from "astro";
import { parsePassportCardParams } from "../../../lib/passportCard";
import { PassportCardImage } from "../../../lib/passportCardImage";

export async function GET(context: APIContext): Promise<Response> {
  const data = parsePassportCardParams(context.url.searchParams);

  return new ImageResponse(PassportCardImage(data), { width: 1200, height: 630 });
}
