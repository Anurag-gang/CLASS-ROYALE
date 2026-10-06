import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

const Schema = z.object({
  email: z.string().email(),
  token: z.string().min(1),
  newPassword: z.string().min(6),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = Schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Invalid password reset request" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: result.data.email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const newHash = await hashPassword(result.data.newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    return NextResponse.json({
      success: true,
      message: "Player password reset successfully! You may now login.",
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}