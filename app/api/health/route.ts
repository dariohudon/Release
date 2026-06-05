import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    project: "release",
    domain: "release.brightening.ca",
    port: 3033,
    pm2Process: "release",
    timestamp: new Date().toISOString(),
  });
}
