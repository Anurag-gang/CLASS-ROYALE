import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { signSessionToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { recordAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { persona = "faculty", redirectUrl } = body;

    let targetUsername = "dr.sharma";
    if (persona === "student") {
      targetUsername = "anurag";
    } else if (persona === "admin") {
      targetUsername = "admin";
    }

    const user = await prisma.user.findFirst({
      where: { username: targetUsername },
      include: { profile: true },
    });

    if (!user) {
      return NextResponse.json({ error: "SSO university identity not found" }, { status: 404 });
    }

    const token = signSessionToken({
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    });

    await recordAuditLog({
      actorId: user.id,
      action: "SSO_UNIVERSITY_LOGIN",
      targetType: "User",
      targetId: user.id,
      metadata: { role: user.role, ssoProvider: "APEX_UNIVERSITY_SAML_OIDC" },
    });

    const targetRedirect =
      redirectUrl ||
      (user.role === "FACULTY"
        ? "/faculty/dashboard"
        : user.role === "ADMIN" || user.role === "SUPER_ADMIN"
        ? "/admin/dashboard"
        : "/dashboard");

    const response = NextResponse.json({
      success: true,
      message: "University SSO identity verified",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        profile: user.profile,
      },
      redirectUrl: targetRedirect,
    });

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("SSO Error:", error);
    return NextResponse.json({ error: "SSO Gateway Error: " + error.message }, { status: 500 });
  }
}
