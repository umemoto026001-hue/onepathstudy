import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Badge, Card, LinkButton, PageHeader } from "@/components/ui";
import {
  CONSULTATION_STATUS_BADGE,
  CONSULTATION_STATUS_LABEL,
  TASK_STATUS_BADGE,
  TASK_STATUS_LABEL,
  WEEKDAY_LABEL,
} from "@/lib/labels";
import { canViewAll, canViewStudentRoster } from "@/lib/permissions";
import { classAccessWhere } from "@/lib/classAccess";
import { formatDate } from "@/lib/date";
import type { Weekday } from "@prisma/client";

const WEEKDAY_BY_JS_DAY: Weekday[] = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;
  const role = session!.user.role as "TEACHER" | "STAFF" | "HQ" | "EXECUTIVE";
  const seeAll = canViewAll(role);
  const todayWeekday = WEEKDAY_BY_JS_DAY[new Date().getDay()];

  const [myTasks, myConsultations, todaysClasses, enrolledCount, recentInterviews] = await Promise.all([
    prisma.task.findMany({
      where: seeAll ? { status: { not: "DONE" } } : { assigneeId: userId, status: { not: "DONE" } },
      include: { assignee: true, creator: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.consultation.findMany({
      where: seeAll
        ? { status: { not: "RESOLVED" } }
        : { OR: [{ posterId: userId }, { assigneeId: userId }], status: { not: "RESOLVED" } },
      include: { poster: true, assignee: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.class.findMany({
      where: { ...classAccessWhere(role, userId, session!.user.campusId), weekday: todayWeekday },
      include: { subject: true, teacher: true },
      orderBy: { startTime: "asc" },
    }),
    canViewStudentRoster(role)
      ? prisma.student.count({
          where: seeAll
            ? { status: "ENROLLED" }
            : { status: "ENROLLED", campusId: session!.user.campusId },
        })
      : Promise.resolve(null),
    canViewStudentRoster(role)
      ? prisma.interview.findMany({
          where: seeAll ? {} : { student: { campusId: session!.user.campusId } },
          include: { student: true },
          orderBy: { date: "desc" },
          take: 5,
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="ダッシュボード"
        actions={
          <>
            <LinkButton href="/tasks/new">タスクを登録する</LinkButton>
            <LinkButton href="/consultations/new" variant="secondary">
              相談を投稿する
            </LinkButton>
            {canViewStudentRoster(role) && (
              <LinkButton href="/students/new" variant="ghost">
                生徒を登録する
              </LinkButton>
            )}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="未対応タスク" value={myTasks.length} color="coral" />
        <SummaryCard label="未対応の相談・クレーム" value={myConsultations.length} color="gold" />
        {enrolledCount !== null && <SummaryCard label="在籍中の生徒" value={enrolledCount} color="green" />}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-heading text-lg font-bold text-navy">
              本日（{WEEKDAY_LABEL[todayWeekday]}曜日）のクラス
            </h2>
            <Link href="/classes" className="text-sm text-coral underline">
              クラス一覧を見る
            </Link>
          </div>
          <ul className="space-y-2">
            {todaysClasses.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/classes/${c.id}`}
                  className="flex flex-wrap items-center gap-2 rounded-lg bg-navy/5 px-3 py-2 text-sm hover:bg-navy/10"
                >
                  <span className="font-medium text-navy">{c.startTime}〜{c.endTime}</span>
                  <span>{c.name}</span>
                  <Badge>{c.subject.name}</Badge>
                  <span className="text-xs text-foreground/50">担当: {c.teacher.name}</span>
                </Link>
              </li>
            ))}
            {todaysClasses.length === 0 && (
              <p className="text-sm text-foreground/50">本日のクラスはありません。</p>
            )}
          </ul>
        </Card>

        <Card>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-heading text-lg font-bold text-navy">未対応タスク</h2>
            <Link href="/tasks" className="text-sm text-coral underline">
              タスク一覧を見る
            </Link>
          </div>
          <ul className="space-y-2">
            {myTasks.map((task) => (
              <li key={task.id} className="rounded-lg bg-navy/5 px-3 py-2 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-navy">{task.title}</span>
                  <Badge color={TASK_STATUS_BADGE[task.status]}>{TASK_STATUS_LABEL[task.status]}</Badge>
                </div>
                <p className="text-xs text-foreground/50">
                  担当: {task.assignee.name} ・ 依頼: {task.creator.name}
                  {task.dueDate && <> ・ 期限: {formatDate(task.dueDate)}</>}
                </p>
              </li>
            ))}
            {myTasks.length === 0 && <p className="text-sm text-foreground/50">未対応のタスクはありません。</p>}
          </ul>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-heading text-lg font-bold text-navy">未対応の相談・クレーム</h2>
            <Link href="/tasks?tab=consultations" className="text-sm text-coral underline">
              相談一覧を見る
            </Link>
          </div>
          <ul className="space-y-2">
            {myConsultations.map((c) => (
              <li key={c.id} className="rounded-lg bg-navy/5 px-3 py-2 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-navy">{c.title}</span>
                  <Badge color={CONSULTATION_STATUS_BADGE[c.status]}>
                    {CONSULTATION_STATUS_LABEL[c.status]}
                  </Badge>
                </div>
                <p className="text-xs text-foreground/50">
                  投稿: {c.poster.name} ・ 担当: {c.assignee.name}
                </p>
              </li>
            ))}
            {myConsultations.length === 0 && (
              <p className="text-sm text-foreground/50">未対応の相談・クレームはありません。</p>
            )}
          </ul>
        </Card>

        {canViewStudentRoster(role) && (
          <Card>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-heading text-lg font-bold text-navy">直近の面談記録</h2>
              <Link href="/interviews" className="text-sm text-coral underline">
                面談記録一覧を見る
              </Link>
            </div>
            <ul className="space-y-2">
              {recentInterviews.map((interview) => (
                <li key={interview.id} className="rounded-lg bg-navy/5 px-3 py-2 text-sm">
                  <span className="font-medium text-navy">{formatDate(interview.date)}</span>{" "}
                  <Link href={`/students/${interview.studentId}`} className="underline">
                    {interview.student.name}
                  </Link>
                </li>
              ))}
              {recentInterviews.length === 0 && (
                <p className="text-sm text-foreground/50">面談記録はまだありません。</p>
              )}
            </ul>
          </Card>
        )}
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
        <span className="text-sm text-foreground/50">件</span>
      </div>
    </Card>
  );
}
