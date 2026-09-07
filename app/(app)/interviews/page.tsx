import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, LinkButton, PageHeader } from "@/components/ui";
import { canViewAll, canViewStudentRoster } from "@/lib/permissions";
import { formatDate } from "@/lib/date";
import type { Prisma } from "@prisma/client";

export default async function InterviewsPage() {
  const session = await auth();
  const role = session!.user.role as "TEACHER" | "STAFF" | "HQ" | "EXECUTIVE";
  if (!canViewStudentRoster(role)) {
    redirect("/dashboard");
  }

  const where: Prisma.InterviewWhereInput = canViewAll(role)
    ? {}
    : { student: { campusId: session!.user.campusId } };

  const interviews = await prisma.interview.findMany({
    where,
    include: { student: true, recordedBy: true },
    orderBy: { date: "desc" },
    take: 100,
  });

  return (
    <div>
      <PageHeader
        title="月次面談記録"
        description={`${interviews.length}件`}
        actions={<LinkButton href="/interviews/new">+ 面談記録を追加する</LinkButton>}
      />

      <div className="space-y-3">
        {interviews.map((interview) => (
          <Card key={interview.id}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-navy">{formatDate(interview.date)}</span>
              <Link href={`/students/${interview.studentId}`} className="font-medium underline">
                {interview.student.name}
              </Link>
              <span className="text-xs text-foreground/40">記録者: {interview.recordedBy.name}</span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm">{interview.content}</p>
          </Card>
        ))}
        {interviews.length === 0 && (
          <Card className="py-8 text-center text-foreground/50">面談記録はまだありません。</Card>
        )}
      </div>
    </div>
  );
}
