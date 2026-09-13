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
import { canManageShifts, canViewAll, canViewStudentRoster, ROLE_LABEL } from "@/lib/permissions";
import { classAccessWhere } from "@/lib/classAccess";
import { formatDate, toDateParam } from "@/lib/date";
import type { Role, Weekday } from "@prisma/client";

const WEEKDAY_BY_JS_DAY: Weekday[] = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

type TimetableBlock = { label: string; start: string; end: string };
type TimetableRow = { userId: string; name: string; role: Role; blocks: TimetableBlock[]; start: string };

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;
  const role = session!.user.role as "TEACHER" | "STAFF" | "HQ" | "EXECUTIVE";
  const seeAll = canViewAll(role);
  const todayWeekday = WEEKDAY_BY_JS_DAY[new Date().getDay()];
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
  const todayParam = toDateParam(startOfToday);

  const [
    myTasks,
    myConsultations,
    todaysClasses,
    todaysShifts,
    todaysScheduledTasks,
    enrolledCount,
    recentInterviews,
  ] = await Promise.all([
    prisma.task.findMany({
      // 個人宛タスクは依頼人・担当者以外には表示しない（役員・本部社員も例外なし）。
      where: { OR: [{ assigneeId: userId }, { creatorId: userId }], status: { not: "DONE" } },
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
    prisma.workShift.findMany({
      where: { weekday: todayWeekday },
      include: { user: true },
      orderBy: { startTime: "asc" },
    }),
    prisma.task.findMany({
      // タイムテーブルに貼られたタスクも、依頼人・担当者以外には見せない。
      where: {
        OR: [{ assigneeId: userId }, { creatorId: userId }],
        scheduledDate: { gte: startOfToday, lt: startOfTomorrow },
      },
      orderBy: { slotStart: "asc" },
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

  const timetableRowsByUser = new Map<string, TimetableRow>();
  for (const shift of todaysShifts) {
    const row = timetableRowsByUser.get(shift.userId) ?? {
      userId: shift.userId,
      name: shift.user.name,
      role: shift.user.role,
      blocks: [],
      start: shift.startTime,
    };
    row.blocks.push({ label: "出勤", start: shift.startTime, end: shift.endTime });
    if (shift.startTime < row.start) row.start = shift.startTime;
    timetableRowsByUser.set(shift.userId, row);
  }
  for (const c of todaysClasses) {
    const row = timetableRowsByUser.get(c.teacherId) ?? {
      userId: c.teacherId,
      name: c.teacher.name,
      role: c.teacher.role,
      blocks: [],
      start: c.startTime,
    };
    row.blocks.push({ label: `${c.name}（${c.subject.name}）`, start: c.startTime, end: c.endTime });
    if (c.startTime < row.start) row.start = c.startTime;
    timetableRowsByUser.set(c.teacherId, row);
  }
  const timetableRows = Array.from(timetableRowsByUser.values())
    .map((row) => ({ ...row, blocks: [...row.blocks].sort((a, b) => a.start.localeCompare(b.start)) }))
    .sort((a, b) => a.start.localeCompare(b.start));

  const scheduledTasksByAssignee = new Map<string, typeof todaysScheduledTasks>();
  for (const task of todaysScheduledTasks) {
    const list = scheduledTasksByAssignee.get(task.assigneeId) ?? [];
    list.push(task);
    scheduledTasksByAssignee.set(task.assigneeId, list);
  }

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

      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-heading text-lg font-bold text-navy">
            本日（{WEEKDAY_LABEL[todayWeekday]}曜日）のタイムテーブル
          </h2>
          {canManageShifts(role) && (
            <Link href="/settings" className="text-sm text-coral underline">
              シフトを設定する
            </Link>
          )}
        </div>
        <div className="space-y-2">
          {timetableRows.map((row) => {
            const tasksForRow = scheduledTasksByAssignee.get(row.userId) ?? [];
            const firstBlock = row.blocks[0];
            return (
              <div key={row.userId} className="rounded-lg border border-navy/10 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-navy">{row.name}</span>
                    <Badge>{ROLE_LABEL[row.role]}</Badge>
                  </div>
                  <Link
                    href={`/tasks/new?assigneeId=${row.userId}&date=${todayParam}&start=${firstBlock.start}&end=${firstBlock.end}`}
                    className="text-xs text-coral underline"
                  >
                    + タスクを貼る
                  </Link>
                </div>
                <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                  {row.blocks.map((b, i) => (
                    <li key={i} className="text-xs text-foreground/60">
                      {b.start}〜{b.end} {b.label}
                    </li>
                  ))}
                </ul>
                {tasksForRow.length > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {tasksForRow.map((task) => (
                      <li key={task.id}>
                        <Link
                          href="/tasks"
                          className="inline-flex items-center gap-1 rounded-full bg-coral/10 px-2.5 py-1 text-xs text-coral"
                        >
                          {task.slotStart && task.slotEnd && `${task.slotStart}〜${task.slotEnd} `}
                          {task.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
          {timetableRows.length === 0 && (
            <p className="text-sm text-foreground/50">
              本日、出勤予定・授業予定の登録はありません。
              {canManageShifts(role) && "「設定」から社員のシフトを登録できます。"}
            </p>
          )}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
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
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
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
