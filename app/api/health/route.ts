import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    project: "release",
    app: "model-radar",
    domain: "release.brightening.ca",
    port: 3033,
    pm2Process: "release",
    timestamp: new Date().toISOString(),
  });
}
