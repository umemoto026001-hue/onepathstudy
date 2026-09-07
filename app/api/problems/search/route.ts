import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!q) return NextResponse.json({ problems: [] });

  const problems = await prisma.problem.findMany({
    where: {
      OR: [
        { title: { contains: q } },
        { unit: { contains: q } },
        { university: { contains: q } },
      ],
    },
    include: { subject: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({
    problems: problems.map((p) => ({
      id: p.id,
      title: p.title,
      subjectName: p.subject.name,
      university: p.university,
    })),
  });
}
