import { NextResponse } from "next/server";
import { checkSonarrHealth } from "@/lib/sonarr";

export const dynamic = "force-dynamic";

export async function GET() {
  const sonarr = await checkSonarrHealth();

  return NextResponse.json({
    status: "ok",
    project: "release",
    domain: "release.brightening.ca",
    port: 3033,
    pm2Process: "release",
    timestamp: new Date().toISOString(),
    sonarr: {
      configured: sonarr.configured,
      reachable: sonarr.reachable,
      ...(sonarr.version ? { version: sonarr.version } : {}),
      ...(sonarr.url ? { url: sonarr.url } : {}),
    },
  });
}
