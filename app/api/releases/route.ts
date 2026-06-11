import { NextResponse } from "next/server";
import { getReleaseFeed } from "@/lib/ai/releases";

export const revalidate = 21600;

export async function GET() {
  const feed = await getReleaseFeed();
  return NextResponse.json(feed, {
    headers: { "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400" },
  });
}
