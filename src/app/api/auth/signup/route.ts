import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, signSessionToken, AUTH_COOKIE_NAME } from "@/lib/auth";

const SignupSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be under 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = SignupSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Invalid input data" },
        { status: 400 }
      );
    }

    const { username, email, password } = result.data;

    // Check existing
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: username.toLowerCase() } },
          { email: { equals: email.toLowerCase() } },
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Username or email is already taken by another player" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    // Create user and profile
    const user = await prisma.user.create({
      data: {
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        passwordHash,
        profile: {
          create: {
            level: 1,
            xp: 0,
            rank: "Novice Apprentice",
            streak: 1,
            avatar: "🧙‍♂️",
            title: "Pixel Initiate",
          },
        },
      },
      include: {
        profile: true,
      },
    });

    // Auto-assign starter quests
    const starterQuests = await prisma.quest.findMany({ take: 3 });
    for (const q of starterQuests) {
      await prisma.userQuest.create({
        data: {
          userId: user.id,
          questId: q.id,
          progress: 0,
          completed: false,
        },
      });
    }

    // Set cookie
    const token = signSessionToken({
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      message: "Player account created!",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        profile: user.profile,
      },
    });

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Failed to create player" }, { status: 500 });
  }
}