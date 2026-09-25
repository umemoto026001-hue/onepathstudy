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
import { canManageShifts, canViewAll, canViewStudentRoster } from "@/lib/permissions";
import { classAccessWhere } from "@/lib/classAccess";
import { formatDate, toDateParam } from "@/lib/date";
import DashboardTimetable, { type TimetableRow } from "@/components/DashboardTimetable";
import { fetchTodaysCalendarEvents } from "@/lib/googleCalendar";
import type { Weekday } from "@prisma/client";

const WEEKDAY_BY_JS_DAY: Weekday[] = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

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
    usersWithCalendar,
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
    prisma.user.findMany({ where: { googleCalendarIcsUrl: { not: null } } }),
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
    };
    row.blocks.push({ label: "出勤", start: shift.startTime, end: shift.endTime, kind: "shift" });
    timetableRowsByUser.set(shift.userId, row);
  }
  for (const c of todaysClasses) {
    const row = timetableRowsByUser.get(c.teacherId) ?? {
      userId: c.teacherId,
      name: c.teacher.name,
      role: c.teacher.role,
      blocks: [],
    };
    row.blocks.push({ label: `${c.name}（${c.subject.name}）`, start: c.startTime, end: c.endTime, kind: "class" });
    timetableRowsByUser.set(c.teacherId, row);
  }

  // Googleカレンダー連携（簡易版・ICS購読）: 各自が /profile で登録したURLから
  // 本日の予定を取得し、タイムテーブルに重ねて表示する。取得失敗は個別に握りつぶし、
  // ダッシュボード全体は壊さない。既に行がある人はその場で「連携エラー」を表示し、
  // シフト等が無く行自体が無い人は下の一覧にまとめて表示する。
  const calendarErrorRowIds = new Set<string>();
  const calendarErrorNamesWithoutRow: string[] = [];
  const calendarResults = await Promise.allSettled(
    usersWithCalendar.map((u) => fetchTodaysCalendarEvents(u.googleCalendarIcsUrl!, startOfToday)),
  );
  usersWithCalendar.forEach((u, i) => {
    const result = calendarResults[i];
    const existingRow = timetableRowsByUser.get(u.id);
    if (result.status === "rejected") {
      if (existingRow) {
        calendarErrorRowIds.add(u.id);
      } else {
        calendarErrorNamesWithoutRow.push(u.name);
      }
      return;
    }
    if (result.value.length === 0) return;
    const row = existingRow ?? { userId: u.id, name: u.name, role: u.role, blocks: [] };
    for (const event of result.value) {
      row.blocks.push({ label: event.label, start: event.start, end: event.end, kind: "calendar" });
    }
    timetableRowsByUser.set(u.id, row);
  });

  const timetableRows = Array.from(timetableRowsByUser.values())
    .map((row) => ({ ...row, blocks: [...row.blocks].sort((a, b) => a.start.localeCompare(b.start)) }))
    .sort((a, b) => a.blocks[0].start.localeCompare(b.blocks[0].start));

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
        {timetableRows.length > 0 ? (
          <DashboardTimetable
            rows={timetableRows}
            tasksByAssignee={scheduledTasksByAssignee}
            todayParam={todayParam}
            calendarErrorRowIds={calendarErrorRowIds}
          />
        ) : (
          <p className="text-sm text-foreground/50">
            本日、出勤予定・授業予定の登録はありません。
            {canManageShifts(role) && "「設定」から社員のシフトを登録できます。"}
          </p>
        )}
        {calendarErrorNamesWithoutRow.length > 0 && (
          <p className="mt-2 text-xs text-coral">
            Googleカレンダーの取得に失敗しています: {calendarErrorNamesWithoutRow.join("、")}
            （本人の「個人設定」でURLを確認してください）
          </p>
        )}
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="未対応タスク" value={myTasks.length} color="coral" />
        <SummaryCard label="未対応の相談・クレーム" value={myConsultations.length} color="gold" />
        {enrolledCount !== null && <SummaryCard label="在籍中の生徒" value={enrolledCount} color="green" />}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <MiniListCard title="未対応タスク" href="/tasks" linkLabel="一覧">
          {myTasks.slice(0, 3).map((task) => (
            <li key={task.id} className="flex items-center justify-between gap-2 rounded-md bg-navy/5 px-2.5 py-1.5">
              <span className="truncate text-navy">{task.title}</span>
              <Badge color={TASK_STATUS_BADGE[task.status]}>{TASK_STATUS_LABEL[task.status]}</Badge>
            </li>
          ))}
          {myTasks.length === 0 && <EmptyLine>未対応のタスクはありません。</EmptyLine>}
        </MiniListCard>

        <MiniListCard title="未対応の相談・クレーム" href="/tasks?tab=consultations" linkLabel="一覧">
          {myConsultations.slice(0, 3).map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-2 rounded-md bg-navy/5 px-2.5 py-1.5">
              <span className="truncate text-navy">{c.title}</span>
              <Badge color={CONSULTATION_STATUS_BADGE[c.status]}>{CONSULTATION_STATUS_LABEL[c.status]}</Badge>
            </li>
          ))}
          {myConsultations.length === 0 && <EmptyLine>未対応の相談・クレームはありません。</EmptyLine>}
        </MiniListCard>

        {canViewStudentRoster(role) && (
          <MiniListCard title="直近の面談記録" href="/interviews" linkLabel="一覧">
            {recentInterviews.slice(0, 3).map((interview) => (
              <li key={interview.id} className="rounded-md bg-navy/5 px-2.5 py-1.5 text-navy">
                <Link href={`/students/${interview.studentId}`} className="hover:underline">
                  {formatDate(interview.date)} {interview.student.name}
                </Link>
              </li>
            ))}
            {recentInterviews.length === 0 && <EmptyLine>面談記録はまだありません。</EmptyLine>}
          </MiniListCard>
        )}
      </div>
    </div>
  );
}

function MiniListCard({
  title,
  href,
  linkLabel,
  children,
}: {
  title: string;
  href: string;
  linkLabel: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-navy">{title}</h2>
        <Link href={href} className="text-xs text-coral underline">
          {linkLabel}
        </Link>
      </div>
      <ul className="space-y-1.5 text-xs">{children}</ul>
    </Card>
  );
}

function EmptyLine({ children }: { children: React.ReactNode }) {
  return <p className="text-foreground/50">{children}</p>;
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
