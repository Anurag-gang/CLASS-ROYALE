/**
 * Socrates Health & Dynamic Model Resolver API Route
 * File: src/app/api/socrates/health/route.ts
 *
 * Endpoint: GET /api/socrates/health
 *
 * Principles:
 * 1. Probes Colibri local inference engine at http://127.0.0.1:8080/health
 * 2. Dynamically resolves active model (e.g. qwen3-coder-30b-a3b-colibri) via /v1/models
 * 3. Never throws uncaught exceptions; always returns clean structured telemetry
 * 4. Supports ?strict=true for monitoring probes expecting HTTP 503 on service outage
 */

import { NextRequest, NextResponse } from "next/server";
import { ColibriClient } from "@/lib/socrates/colibriClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const colibriClient = new ColibriClient({
  healthTimeoutMs: 1500,
});

export interface SocratesHealthResponse {
  online: boolean;
  status: "ok" | "offline" | "restarting" | "engine_down";
  model: string;
  endpoint: string;
  latencyMs: number;
  timestamp: string;
  details?: Record<string, unknown>;
}

export async function GET(req?: NextRequest) {
  try {
    const health = await colibriClient.checkHealth();

    const responsePayload: SocratesHealthResponse = {
      online: health.online,
      status: health.status,
      model: health.model,
      endpoint: health.endpoint,
      latencyMs: health.latencyMs ?? 0,
      timestamp: new Date().toISOString(),
      ...(health.details ? { details: health.details } : {}),
    };

    // By default return 200 with online: boolean so UI status indicators (status pill)
    // can render without throwing network errors.
    // If strict mode is requested via query param or header, return 503 when offline.
    const isStrict =
      req?.nextUrl?.searchParams?.get("strict") === "true" ||
      req?.headers?.get("x-health-strict") === "true";

    const httpStatus = isStrict && !health.online ? 503 : 200;

    return NextResponse.json(responsePayload, {
      status: httpStatus,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (err: unknown) {
    const defaultModel = colibriClient.getDefaultModel();
    const endpoint = colibriClient.getBaseUrl();

    return NextResponse.json(
      {
        online: false,
        status: "offline",
        model: defaultModel,
        endpoint,
        latencyMs: 0,
        timestamp: new Date().toISOString(),
        error: err instanceof Error ? err.message : "Health check failed",
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  }
}
