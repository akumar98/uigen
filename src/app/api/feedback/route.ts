import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { content } = await req.json();

  if (!content?.trim()) {
    return NextResponse.json(
      { error: "Feedback content is required" },
      { status: 400 }
    );
  }

  const session = await getSession();

  const feedback = await prisma.feedback.create({
    data: {
      content: content.trim(),
      userId: session?.userId ?? null,
    },
  });

  return NextResponse.json({ success: true, id: feedback.id });
}
