import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Badge, Card, LinkButton, PageHeader } from "@/components/ui";
import {
  CONSULTATION_STATUS_BADGE,
  CONSULTATION_STATUS_LABEL,
  STUDENT_STATUS_BADGE,
  STUDENT_STATUS_LABEL,
} from "@/lib/labels";
import { canViewAll, canViewStudentRoster } from "@/lib/permissions";
import { formatDate, formatDateTime } from "@/lib/date";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const role = session!.user.role as "TEACHER" | "STAFF" | "HQ" | "EXECUTIVE";
  if (!canViewStudentRoster(role)) {
    redirect("/dashboard");
  }

  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      subjects: true,
      campus: true,
      classEnrollments: { include: { class: { include: { subject: true, teacher: true } } } },
      interviews: { include: { recordedBy: true }, orderBy: { date: "desc" } },
      consultations: { include: { poster: true, assignee: true }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!student) notFound();
  if (!canViewAll(role) && student.campusId !== session!.user.campusId) {
    redirect("/students");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={student.name}
        description={`生徒番号: ${student.studentNumber} ・ ${student.targetSchool ?? "志望校未設定"}`}
        actions={
          <>
            <LinkButton href={`/interviews/new?studentId=${student.id}`}>面談記録を追加</LinkButton>
            <LinkButton href={`/students/${student.id}/edit`} variant="ghost">
              編集する
            </LinkButton>
          </>
        }
      />

      <Card>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Info label="在籍ステータス">
            <Badge color={STUDENT_STATUS_BADGE[student.status]}>
              {STUDENT_STATUS_LABEL[student.status]}
            </Badge>
          </Info>
          <Info label="受講科目">
            <div className="flex flex-wrap gap-1">
              {student.subjects.map((s) => (
                <Badge key={s.id}>{s.name}</Badge>
              ))}
              {student.subjects.length === 0 && <span className="text-foreground/40">-</span>}
            </div>
          </Info>
          <Info label="校舎">{student.campus?.name ?? "-"}</Info>
          <Info label="入会日">{student.enrolledAt ? formatDate(student.enrolledAt) : "-"}</Info>
          <Info label="保護者連絡先">{student.parentContact ?? "-"}</Info>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-heading text-lg font-bold text-navy">所属クラス</h2>
          <ul className="space-y-2">
            {student.classEnrollments.map((e) => (
              <li key={e.id} className="rounded-lg bg-navy/5 px-3 py-2 text-sm">
                <span className="font-medium">{e.class.name}</span>{" "}
                <Badge>{e.class.subject.name}</Badge>{" "}
                <span className="text-foreground/50">担当: {e.class.teacher.name}</span>
              </li>
            ))}
            {student.classEnrollments.length === 0 && (
              <p className="text-sm text-foreground/50">所属クラスはまだありません。</p>
            )}
          </ul>
        </Card>

        <Card>
          <h2 className="mb-3 font-heading text-lg font-bold text-navy">関連する相談・クレーム</h2>
          <ul className="space-y-2">
            {student.consultations.map((c) => (
              <li key={c.id} className="rounded-lg bg-navy/5 px-3 py-2 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{c.title}</span>
                  <Badge color={CONSULTATION_STATUS_BADGE[c.status]}>
                    {CONSULTATION_STATUS_LABEL[c.status]}
                  </Badge>
                </div>
                <p className="text-xs text-foreground/50">
                  投稿: {c.poster.name} ・ 担当: {c.assignee.name} ・ {formatDateTime(c.createdAt)}
                </p>
              </li>
            ))}
            {student.consultations.length === 0 && (
              <p className="text-sm text-foreground/50">関連する相談・クレームはありません。</p>
            )}
          </ul>
        </Card>
      </div>

      <Card>
        <h2 className="mb-3 font-heading text-lg font-bold text-navy">月次面談記録</h2>
        <ul className="space-y-3">
          {student.interviews.map((interview) => (
            <li key={interview.id} className="border-l-2 border-coral/40 pl-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-navy">{formatDate(interview.date)}</span>
                <span className="text-xs text-foreground/40">記録者: {interview.recordedBy.name}</span>
              </div>
              <p className="mt-1 whitespace-pre-wrap">{interview.content}</p>
            </li>
          ))}
          {student.interviews.length === 0 && (
            <p className="text-sm text-foreground/50">面談記録はまだありません。</p>
          )}
        </ul>
      </Card>
    </div>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-navy/60">{label}</p>
      <div className="mt-0.5 text-sm">{children}</div>
    </div>
  );
}
