import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { joinCode } = body;

    if (!joinCode) {
      return NextResponse.json({ error: "Join code is required" }, { status: 400 });
    }

    const clan = await prisma.clan.findUnique({
      where: { joinCode: joinCode.trim() },
    });

    if (!clan) {
      return NextResponse.json({ error: "Clan not found with that join code" }, { status: 404 });
    }

    const existingMember = await prisma.clanMember.findUnique({
      where: {
        clanId_userId: {
          clanId: clan.id,
          userId: user.id,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json({ message: "You are already a member of this clan", clanId: clan.id });
    }

    await prisma.clanMember.create({
      data: {
        clanId: clan.id,
        userId: user.id,
        role: "MEMBER",
      },
    });

    return NextResponse.json({ success: true, clanId: clan.id });
  } catch (error) {
    console.error("Clan join error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
