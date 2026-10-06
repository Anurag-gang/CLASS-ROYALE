import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { calculateLevelFromXp } from "@/lib/game-mechanics";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const levelInfo = user.profile ? calculateLevelFromXp(user.profile.xp) : null;

  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      profile: user.profile,
      levelInfo,
      teachingClassesCount: (user as any).teachingClasses?.length || 0,
      enrolledClassesCount: (user as any).enrolledClasses?.length || 0,
    },
  });
}