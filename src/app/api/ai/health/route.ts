import { NextResponse } from "next/server";
import { AIProviderFactory } from "@/lib/ai/providers/AIProviderFactory";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const telemetry = await AIProviderFactory.getTelemetry();
    return NextResponse.json(telemetry, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      {
        status: "error",
        error: err?.message || String(err),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
