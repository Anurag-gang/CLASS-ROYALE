import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getStudentLearningContext } from "@/lib/cr/cr-context";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const context = await getStudentLearningContext(user.id);
  if (!context) {
    return NextResponse.json({ error: "Failed to load learning context" }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    context,
  });
}