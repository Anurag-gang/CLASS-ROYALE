import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { comparePassword, signSessionToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { recordAuditLog } from "@/lib/audit";

const LoginSchema = z.object({
  identifier: z.string().min(1, "Username, student ID, or email is required"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = LoginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Invalid credentials format" },
        { status: 400 }
      );
    }

    const { identifier, password } = result.data;
    const cleanId = identifier.trim().toLowerCase();

    // Look up by username, email, or student ID / faculty ID
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: cleanId } },
          { email: { equals: cleanId } },
          { profile: { studentId: { equals: identifier.trim() } } },
          { profile: { facultyId: { equals: identifier.trim() } } },
        ],
      },
      include: {
        profile: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid academic credentials" }, { status: 401 });
    }

    const passwordValid = await comparePassword(password, user.passwordHash);
    if (!passwordValid) {
      return NextResponse.json({ error: "Invalid academic credentials" }, { status: 401 });
    }

    // Check for provisioning
    if (!user.profile) {
      return NextResponse.json(
        {
          error: "ACCOUNT_NOT_PROVISIONED",
          message: "Your university account was authenticated, but Class Royale could not find your student/faculty record. Please contact your administrator.",
        },
        { status: 403 }
      );
    }

    // Sign session token with role
    const token = signSessionToken({
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    });

    await recordAuditLog({
      actorId: user.id,
      action: "USER_LOGIN",
      targetType: "User",
      targetId: user.id,
      metadata: { role: user.role, username: user.username },
    });

    const response = NextResponse.json({
      success: true,
      message: "Academic authentication successful",
      role: user.role,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        profile: user.profile,
      },
      redirectUrl:
        user.role === "FACULTY"
          ? "/faculty/dashboard"
          : user.role === "ADMIN" || user.role === "SUPER_ADMIN"
          ? "/admin/dashboard"
          : "/dashboard",
    });

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Authentication system error" }, { status: 500 });
  }
}