import { NextResponse } from "next/server";

/* ──────────────────────────────────────────────────────────────
   Native-client API contract — read-only public endpoints.

   Every endpoint returns exactly one of these envelopes:

   success: { ok: true,  generatedAt, count, data }
   failure: { ok: false, generatedAt, error, data: null }

   Rules (see README "Native client API"):
   - read-only; no mutation endpoints exist
   - never leaks filesystem paths, logs, or candidate-review files
   - the curated catalog is the source of truth; nothing here edits it
   ────────────────────────────────────────────────────────────── */

export interface ApiSuccess<T> {
  ok: true;
  generatedAt: string; // ISO timestamp
  count: number;
  data: T;
}

export interface ApiFailure {
  ok: false;
  generatedAt: string;
  error: string; // short, safe message — no paths, no internals
  data: null;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export function apiOk<T>(data: T, count: number, cacheControl?: string): NextResponse {
  const body: ApiSuccess<T> = { ok: true, generatedAt: new Date().toISOString(), count, data };
  return NextResponse.json(body, {
    headers: cacheControl ? { "Cache-Control": cacheControl } : undefined,
  });
}

export function apiFail(error: string, status = 404): NextResponse {
  const body: ApiFailure = { ok: false, generatedAt: new Date().toISOString(), error, data: null };
  return NextResponse.json(body, { status });
}
