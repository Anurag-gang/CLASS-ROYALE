import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();

  return NextResponse.json({
    status: "ok",
    app: "class-royale-web",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    latencyMs: Date.now() - startTime,
    checks: {
      liveness: "pass",
      readiness: "pass",
    },
  });
}
