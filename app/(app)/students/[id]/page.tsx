import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge, Card, LinkButton, PageHeader } from "@/components/ui";
import {
  GRADE_LABEL,
  SCHEDULE_STATUS_BADGE,
  SCHEDULE_STATUS_LABEL,
  STUDENT_STATUS_BADGE,
  STUDENT_STATUS_LABEL,
  UNDERSTANDING_BADGE,
  UNDERSTANDING_LABEL,
} from "@/lib/labels";
import { formatDate, formatDateTime } from "@/lib/date";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      subjects: true,
      schedules: {
        include: { subject: true, teacher: true },
        orderBy: { startAt: "desc" },
        take: 20,
      },
      progressLogs: {
        include: { subject: true, teacher: true, relatedProblems: true },
        orderBy: { date: "desc" },
      },
    },
  });

  if (!student) notFound();

  const now = new Date();
  const upcoming = student.schedules
    .filter((s) => s.startAt >= now)
    .sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
  const past = student.schedules.filter((s) => s.startAt < now);

  return (
    <div className="space-y-6">
      <PageHeader
        title={student.name}
        description={`${GRADE_LABEL[student.grade]} ・ ${student.targetUniversity ?? "志望大学未設定"}`}
        actions={
          <>
            <LinkButton href={`/progress/new?studentId=${student.id}`}>
              進捗を記録する
            </LinkButton>
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
          <Info label="志望学部">{student.targetFaculty ?? "-"}</Info>
          <Info label="入会日">{student.enrolledAt ? formatDate(student.enrolledAt) : "-"}</Info>
          <Info label="保護者氏名">{student.parentName ?? "-"}</Info>
          <Info label="保護者連絡先">{student.parentContact ?? "-"}</Info>
          <Info label="生徒本人の連絡先">{student.studentContact ?? "-"}</Info>
        </div>
        {student.memo && (
          <div className="mt-4 border-t border-navy/10 pt-4">
            <p className="mb-1 text-xs font-medium text-navy/60">メモ</p>
            <p className="whitespace-pre-wrap text-sm">{student.memo}</p>
          </div>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-heading text-lg font-bold text-navy">授業スケジュール</h2>
            <Link href={`/schedule/new?studentId=${student.id}`} className="text-sm text-coral underline">
              + 予定を追加
            </Link>
          </div>
          <ScheduleSection title="今後の予定" items={upcoming} studentId={student.id} />
          <ScheduleSection title="過去の実施履歴" items={past} studentId={student.id} className="mt-4" />
          {student.schedules.length === 0 && (
            <p className="text-sm text-foreground/50">授業スケジュールはまだ登録されていません。</p>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 font-heading text-lg font-bold text-navy">進捗記録タイムライン</h2>
          <ul className="space-y-4">
            {student.progressLogs.map((log) => (
              <li key={log.id} className="border-l-2 border-coral/40 pl-3">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-medium text-navy">{formatDate(log.date)}</span>
                  <Badge>{log.subject.name}</Badge>
                  {log.understandingLevel && (
                    <Badge color={UNDERSTANDING_BADGE[log.understandingLevel]}>
                      {UNDERSTANDING_LABEL[log.understandingLevel]}
                    </Badge>
                  )}
                  <span className="text-xs text-foreground/40">担当: {log.teacher.name}</span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm">{log.coveredContent}</p>
                {log.homework && (
                  <p className="mt-1 text-sm text-foreground/70">
                    <span className="font-medium">宿題: </span>
                    {log.homework}
                  </p>
                )}
                {log.relatedProblems.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {log.relatedProblems.map((p) => (
                      <Link key={p.id} href={`/problems/${p.id}`}>
                        <Badge color="gold">{p.title}</Badge>
                      </Link>
                    ))}
                  </div>
                )}
              </li>
            ))}
            {student.progressLogs.length === 0 && (
              <p className="text-sm text-foreground/50">進捗記録はまだありません。</p>
            )}
          </ul>
        </Card>
      </div>
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

function ScheduleSection({
  title,
  items,
  studentId,
  className,
}: {
  title: string;
  items: {
    id: string;
    startAt: Date;
    endAt: Date;
    status: import("@prisma/client").ScheduleStatus;
    subject: { name: string };
  }[];
  studentId: string;
  className?: string;
}) {
  if (items.length === 0) return null;
  return (
    <div className={className}>
      <p className="mb-2 text-xs font-medium text-navy/60">{title}</p>
      <ul className="space-y-2">
        {items.map((s) => (
          <li key={s.id} className="flex items-center justify-between rounded-lg bg-navy/5 px-3 py-2 text-sm">
            <Link href={`/schedule?scheduleId=${s.id}`} className="flex flex-1 items-center gap-2">
              <span>{formatDateTime(s.startAt)}</span>
              <Badge>{s.subject.name}</Badge>
            </Link>
            <div className="flex items-center gap-2">
              <Badge color={SCHEDULE_STATUS_BADGE[s.status]}>{SCHEDULE_STATUS_LABEL[s.status]}</Badge>
              <Link
                href={`/progress/new?studentId=${studentId}&scheduleId=${s.id}`}
                className="text-xs text-coral underline"
              >
                進捗記録
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
