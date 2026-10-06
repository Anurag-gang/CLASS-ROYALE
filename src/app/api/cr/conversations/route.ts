import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET: list all conversations for current student
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conversations = await prisma.cRConversation.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  return NextResponse.json({
    success: true,
    conversations: conversations.map((c) => ({
      id: c.id,
      title: c.title,
      subjectContext: c.subjectContext,
      updatedAt: c.updatedAt,
      lastMessage: c.messages[0]?.text || "New conversation",
    })),
  });
}

// POST: create new conversation
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const { title = "New Study Quest", subjectContext } = body;

  const conversation = await prisma.cRConversation.create({
    data: {
      userId: user.id,
      title,
      subjectContext,
      messages: {
        create: {
          sender: "cr",
          text: `👑 **CR ONLINE**\nWelcome back, ${user.username}! I am ready to guide your study quest. What shall we learn or battle today?`,
          type: "message",
        },
      },
    },
    include: { messages: true },
  });

  return NextResponse.json({
    success: true,
    conversation,
  });
}