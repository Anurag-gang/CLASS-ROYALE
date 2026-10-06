import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAIProvider } from "@/lib/ai/provider";
import { buildStudentContext } from "@/lib/ai/context";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const packs = await prisma.cRRevisionPack.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      packs: packs.map((p) => ({
        ...p,
        cards: p.cardsJson ? JSON.parse(p.cardsJson) : [],
      })),
    });
  } catch (error: any) {
    console.error("[CR_REVISION_GET]", error);
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
    const { topic = "Algorithms & Data Structures", cardCount = 6 } = body;

    const provider = getAIProvider();
    const context = await buildStudentContext(user.id);

    const revisionResult = await provider.generateRevision(
      {
        topic,
        cardCount: Number(cardCount) || 6,
      },
      context
    );

    const savedPack = await prisma.cRRevisionPack.create({
      data: {
        userId: user.id,
        topic: revisionResult.topic,
        summary: revisionResult.summary,
        cardsJson: JSON.stringify(revisionResult.cards),
      },
    });

    return NextResponse.json({
      success: true,
      pack: {
        ...revisionResult,
        packId: savedPack.id,
      },
    });
  } catch (error: any) {
    console.error("[CR_REVISION_POST]", error);
    return NextResponse.json(
      { error: "Failed to generate revision pack: " + (error?.message || String(error)) },
      { status: 500 }
    );
  }
}
