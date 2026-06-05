import { NextResponse } from "next/server";
import { checkSonarrHealth } from "@/lib/sonarr";
import { checkPlexHealth } from "@/lib/plex";

export const dynamic = "force-dynamic";

export async function GET() {
  const [sonarr, plex] = await Promise.all([
    checkSonarrHealth(),
    checkPlexHealth(),
  ]);

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
    plex: {
      configured: plex.configured,
      reachable: plex.reachable,
      ...(plex.version ? { version: plex.version } : {}),
      tvLibrary: plex.tvLibrary,
      ...(plex.libraryFound !== undefined ? { libraryFound: plex.libraryFound } : {}),
    },
  });
}
