import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CR_TOOLS_REGISTRY } from "@/lib/ai/tools";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const plans = await prisma.cRStudyPlan.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, plans });
  } catch (error: any) {
    console.error("[CR_STUDY_PLAN_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { subject = "Computer Science Fundamentals", examDate } = body;

    const plan = await CR_TOOLS_REGISTRY.create_study_plan.execute(user.id, {
      subject,
      examDate,
    });

    return NextResponse.json({ success: true, plan });
  } catch (error: any) {
    console.error("[CR_STUDY_PLAN_POST]", error);
    return NextResponse.json({ error: "Failed to generate study plan: " + (error?.message || String(error)) }, { status: 500 });
  }
}
