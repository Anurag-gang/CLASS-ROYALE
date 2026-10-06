import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const Schema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = Schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: result.data.email.toLowerCase() },
    });

    // For privacy, return success message even if not found in demo
    return NextResponse.json({
      success: true,
      message: "If an account exists with this email, a reset transmission was dispatched.",
      demoResetToken: user ? "RETRO-RESET-8BIT-TOKEN-KEY" : null,
    });
  } catch (error) {
    return NextResponse.json({ error: "Reset transmission failed" }, { status: 500 });
  }
}