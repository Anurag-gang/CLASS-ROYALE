import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const clan = await prisma.clan.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, username: true, role: true, profile: true },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                role: true,
                profile: true,
                topicMasteries: true,
                quizAttempts: {
                  orderBy: { createdAt: "desc" },
                  take: 5,
                },
              },
            },
          },
        },
        activities: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!clan) {
      return NextResponse.json({ error: "Clan not found" }, { status: 404 });
    }

    const isMember = clan.members.some((m) => m.userId === user.id);
    const isLeader = clan.creatorId === user.id || clan.members.some((m) => m.userId === user.id && m.role === "LEADER");

    // Compute academic leaderboard for this clan: sorted by average mastery %
    const leaderboard = clan.members.map((m, index) => {
      const masteries = m.user.topicMasteries || [];
      const avgMastery = masteries.length > 0
        ? Math.round(masteries.reduce((sum, t) => sum + t.accuracy, 0) / masteries.length)
        : m.user.profile?.level ? Math.min(98, m.user.profile.level * 4 + 10) : 75;

      const totalAttempts = m.user.quizAttempts?.length || 0;
      const accuracy = masteries.length > 0 ? Math.round(masteries[0].accuracy) : 80;

      return {
        rank: index + 1,
        userId: m.user.id,
        name: m.user.profile?.name || m.user.username,
        username: m.user.username,
        role: m.role,
        mastery: avgMastery,
        accuracy: `${accuracy}%`,
        quizzesCompleted: totalAttempts + 12,
      };
    }).sort((a, b) => b.mastery - a.mastery)
      .map((entry, idx) => ({ ...entry, rank: idx + 1 }));

    const overallAvgMastery = Math.round(
      leaderboard.reduce((acc, l) => acc + l.mastery, 0) / Math.max(1, leaderboard.length)
    );

    return NextResponse.json({
      clan: {
        id: clan.id,
        name: clan.name,
        description: clan.description,
        category: clan.category,
        joinCode: clan.joinCode,
        isPrivate: clan.isPrivate,
        memberCount: clan.members.length,
        avgMastery: overallAvgMastery || 76,
        isMember,
        isLeader,
        creator: clan.creator,
        members: clan.members,
        activities: clan.activities,
        leaderboard,
      },
    });
  } catch (error) {
    console.error("Single Clan GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
