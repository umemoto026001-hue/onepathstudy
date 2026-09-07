import Link from "next/link";
import { addDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import { Badge, Card, LinkButton, PageHeader } from "@/components/ui";
import { formatDate, formatDateTime } from "@/lib/date";
import {
  SCHEDULE_STATUS_BADGE,
  SCHEDULE_STATUS_LABEL,
  UNDERSTANDING_BADGE,
  UNDERSTANDING_LABEL,
} from "@/lib/labels";

export default async function DashboardPage() {
  const now = new Date();
  const weekLater = addDays(now, 7);

  const [
    upcomingSchedules,
    enrolledCount,
    trialCount,
    consideringCount,
    recentLogs,
  ] = await Promise.all([
    prisma.classSchedule.findMany({
      where: { startAt: { gte: now, lte: weekLater } },
      include: { student: true, subject: true },
      orderBy: { startAt: "asc" },
    }),
    prisma.student.count({ where: { status: "ENROLLED" } }),
    prisma.student.count({ where: { status: "TRIAL" } }),
    prisma.student.count({ where: { status: "CONSIDERING" } }),
    prisma.progressLog.findMany({
      include: { student: true, subject: true },
      orderBy: { date: "desc" },
      take: 5,
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="ダッシュボード"
        actions={
          <>
            <LinkButton href="/students/new">生徒を登録する</LinkButton>
            <LinkButton href="/schedule/new" variant="secondary">
              授業を登録する
            </LinkButton>
            <LinkButton href="/problems/new" variant="ghost">
              演習問題を登録する
            </LinkButton>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="在籍中の生徒" value={enrolledCount} color="green" />
        <SummaryCard label="体験中の生徒" value={trialCount} color="gold" />
        <SummaryCard label="検討中の生徒" value={consideringCount} color="gray" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold text-navy">
              本日・今後7日間の授業予定
            </h2>
            <Link href="/schedule" className="text-sm text-coral underline">
              スケジュール全体を見る
            </Link>
          </div>
          <ul className="space-y-2">
            {upcomingSchedules.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/schedule?scheduleId=${s.id}`}
                  className="flex flex-wrap items-center gap-2 rounded-lg bg-navy/5 px-3 py-2 text-sm hover:bg-navy/10"
                >
                  <span className="font-medium text-navy">{formatDateTime(s.startAt)}</span>
                  <span>{s.student.name}</span>
                  <Badge>{s.subject.name}</Badge>
                  <Badge color={SCHEDULE_STATUS_BADGE[s.status]}>
                    {SCHEDULE_STATUS_LABEL[s.status]}
                  </Badge>
                </Link>
              </li>
            ))}
            {upcomingSchedules.length === 0 && (
              <p className="text-sm text-foreground/50">今後7日間の授業予定はありません。</p>
            )}
          </ul>
        </Card>

        <Card>
          <h2 className="mb-3 font-heading text-lg font-bold text-navy">直近の進捗記録</h2>
          <ul className="space-y-3">
            {recentLogs.map((log) => (
              <li key={log.id} className="border-l-2 border-coral/40 pl-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-navy">{formatDate(log.date)}</span>
                  <Link href={`/students/${log.studentId}`} className="underline">
                    {log.student.name}
                  </Link>
                  <Badge>{log.subject.name}</Badge>
                  {log.understandingLevel && (
                    <Badge color={UNDERSTANDING_BADGE[log.understandingLevel]}>
                      {UNDERSTANDING_LABEL[log.understandingLevel]}
                    </Badge>
                  )}
                </div>
                <p className="mt-1 line-clamp-2 text-foreground/70">{log.coveredContent}</p>
              </li>
            ))}
            {recentLogs.length === 0 && (
              <p className="text-sm text-foreground/50">進捗記録はまだありません。</p>
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "navy" | "coral" | "gold" | "gray" | "green";
}) {
  const barColor: Record<string, string> = {
    navy: "bg-navy",
    coral: "bg-coral",
    gold: "bg-gold",
    gray: "bg-foreground/30",
    green: "bg-emerald-500",
  };
  return (
    <Card className="relative overflow-hidden">
      <span className={`absolute inset-y-0 left-0 w-1.5 ${barColor[color]}`} />
      <p className="text-sm text-foreground/60">{label}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="font-heading text-3xl font-bold text-navy">{value}</span>
        <span className="text-sm text-foreground/50">人</span>
      </div>
    </Card>
  );
}
