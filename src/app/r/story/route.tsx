import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { parseRecapParams } from "@/lib/recapParams";
import { brandFonts, RecapStory } from "@/lib/ogKit";

// "my week in hooks" story image. Everything drawn comes from the link's own
// query string, clamped and allow-listed (lib/recapParams.ts) — no account.
export async function GET(request: NextRequest) {
  const p = parseRecapParams(request.nextUrl.searchParams);
  return new ImageResponse(<RecapStory p={p} />, {
    width: 1080,
    height: 1920,
    fonts: await brandFonts(),
    headers: {
      "cache-control": "public, max-age=86400, immutable",
      "content-disposition": 'inline; filename="my-week-in-hooks.png"',
    },
  });
}
