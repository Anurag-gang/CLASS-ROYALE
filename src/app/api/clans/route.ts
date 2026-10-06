import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clans = await prisma.clan.findMany({
      include: {
        creator: {
          select: { id: true, username: true, role: true, profile: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, username: true, role: true, profile: true },
            },
          },
        },
        activities: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedClans = clans.map((clan) => {
      const isMember = clan.members.some((m) => m.userId === user.id);
      const isLeader = clan.creatorId === user.id || clan.members.some((m) => m.userId === user.id && m.role === "LEADER");

      // Approximate avg mastery from member profiles
      const avgMastery = Math.round(
        clan.members.reduce((acc, m) => acc + (m.user.profile?.level ? Math.min(100, m.user.profile.level * 4) : 70), 0) /
          Math.max(1, clan.members.length)
      );

      return {
        id: clan.id,
        name: clan.name,
        description: clan.description,
        category: clan.category,
        joinCode: clan.joinCode,
        isPrivate: clan.isPrivate,
        memberCount: clan.members.length,
        avgMastery: avgMastery || 76,
        activityCount: clan.activities.length,
        isMember,
        isLeader,
        creator: {
          username: clan.creator.username,
          role: clan.creator.role,
        },
        recentActivities: clan.activities.slice(0, 3),
      };
    });

    return NextResponse.json({
      clans: formattedClans,
      myClans: formattedClans.filter((c) => c.isMember),
    });
  } catch (error) {
    console.error("Clans GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, category = "STUDY_GROUP", isPrivate = false } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Clan name is required" }, { status: 400 });
    }

    // Generate unique join code
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const joinCode = `CR-${name.slice(0, 4).toUpperCase().replace(/[^A-Z]/g, "X")}-${randomSuffix}`;

    const newClan = await prisma.clan.create({
      data: {
        name,
        description,
        category,
        isPrivate,
        joinCode,
        creatorId: user.id,
        members: {
          create: [
            {
              userId: user.id,
              role: "LEADER",
            },
          ],
        },
      },
      include: {
        members: true,
      },
    });

    return NextResponse.json({ clan: newClan, success: true }, { status: 201 });
  } catch (error) {
    console.error("Clans POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
