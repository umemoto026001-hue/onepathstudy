import Link from "next/link";
import { addDays, subDays } from "date-fns";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, Input, LinkButton, PageHeader } from "@/components/ui";
import { canManageShifts, canViewStudentRoster } from "@/lib/permissions";
import { classAccessWhere } from "@/lib/classAccess";
import { formatDate, formatDayShort, toDateParam } from "@/lib/date";
import DashboardTimetable, { type TimetableRow } from "@/components/DashboardTimetable";
import { fetchCalendarEventsForDay } from "@/lib/googleCalendar";
import type { Weekday } from "@prisma/client";

const WEEKDAY_BY_JS_DAY: Weekday[] = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const session = await auth();
  const userId = session!.user.id;
  const role = session!.user.role as "TEACHER" | "STAFF" | "HQ" | "EXECUTIVE";

  const { date } = await searchParams;
  const todayParam = toDateParam(new Date());
  const startOfSelectedDay = date ? new Date(`${date}T00:00:00`) : new Date();
  startOfSelectedDay.setHours(0, 0, 0, 0);
  const startOfNextDay = new Date(startOfSelectedDay);
  startOfNextDay.setDate(startOfNextDay.getDate() + 1);
  const selectedDateParam = toDateParam(startOfSelectedDay);
  const selectedWeekday = WEEKDAY_BY_JS_DAY[startOfSelectedDay.getDay()];
  const isToday = selectedDateParam === todayParam;

  const [todaysClasses, todaysShifts, todaysScheduledTasks, todaysSchedules, usersWithCalendar] =
    await Promise.all([
      prisma.class.findMany({
        where: { ...classAccessWhere(role, userId, session!.user.campusId), weekday: selectedWeekday },
        include: { subject: true, teacher: true },
        orderBy: { startTime: "asc" },
      }),
      prisma.workShift.findMany({
        where: { weekday: selectedWeekday },
        include: { user: true },
        orderBy: { startTime: "asc" },
      }),
      prisma.task.findMany({
        // タイムテーブルに貼られたタスクも、依頼人・担当者以外には見せない。
        where: {
          OR: [{ assigneeId: userId }, { creatorId: userId }],
          scheduledDate: { gte: startOfSelectedDay, lt: startOfNextDay },
        },
        orderBy: { slotStart: "asc" },
      }),
      prisma.schedule.findMany({
        where: { date: { gte: startOfSelectedDay, lt: startOfNextDay } },
        include: { owner: true },
        orderBy: { startTime: "asc" },
      }),
      prisma.user.findMany({ where: { googleCalendarIcsUrl: { not: null } } }),
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
  for (const s of todaysSchedules) {
    const row = timetableRowsByUser.get(s.ownerId) ?? {
      userId: s.ownerId,
      name: s.owner.name,
      role: s.owner.role,
      blocks: [],
    };
    row.blocks.push({
      label: s.title,
      start: s.startTime,
      end: s.endTime,
      kind: "schedule",
      id: s.id,
      deletable: s.ownerId === userId || s.creatorId === userId,
    });
    timetableRowsByUser.set(s.ownerId, row);
  }

  // Googleカレンダー連携（簡易版・ICS購読）: 各自が /profile で登録したURLから
  // 本日の予定を取得し、タイムテーブルに重ねて表示する。取得失敗は個別に握りつぶし、
  // ダッシュボード全体は壊さない。既に行がある人はその場で「連携エラー」を表示し、
  // シフト等が無く行自体が無い人は下の一覧にまとめて表示する。
  const calendarErrorRowIds = new Set<string>();
  const calendarErrorNamesWithoutRow: string[] = [];
  const calendarResults = await Promise.allSettled(
    usersWithCalendar.map((u) => fetchCalendarEventsForDay(u.googleCalendarIcsUrl!, startOfSelectedDay)),
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
            <LinkButton href={`/schedules/new?date=${selectedDateParam}`} variant="secondary">
              スケジュールを登録する
            </LinkButton>
            <LinkButton href="/consultations/new" variant="ghost">
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

      <Card className="p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-2xl font-bold text-navy">
            {formatDate(startOfSelectedDay)}のタイムテーブル
            {isToday && <span className="ml-2 text-sm font-normal text-coral">本日</span>}
          </h2>
          {canManageShifts(role) && (
            <Link href="/settings" className="text-sm text-coral underline">
              シフトを設定する
            </Link>
          )}
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Link
            href={`/dashboard?date=${toDateParam(subDays(startOfSelectedDay, 1))}`}
            className="rounded-lg border border-navy/20 px-3 py-1.5 text-sm hover:bg-navy/5"
          >
            ← 前日
          </Link>
          <Link
            href={`/dashboard?date=${toDateParam(addDays(startOfSelectedDay, 1))}`}
            className="rounded-lg border border-navy/20 px-3 py-1.5 text-sm hover:bg-navy/5"
          >
            翌日 →
          </Link>
          {!isToday && (
            <Link href="/dashboard" className="rounded-lg border border-navy/20 px-3 py-1.5 text-sm hover:bg-navy/5">
              今日に戻る
            </Link>
          )}
          <form method="get" className="flex items-center gap-2">
            <Input id="date" name="date" type="date" defaultValue={selectedDateParam} className="py-1.5" />
            <button
              type="submit"
              className="rounded-lg bg-navy px-3 py-1.5 text-sm font-bold text-white hover:opacity-90"
            >
              表示
            </button>
          </form>
        </div>

        {timetableRows.length > 0 ? (
          <DashboardTimetable
            rows={timetableRows}
            tasksByAssignee={scheduledTasksByAssignee}
            dateParam={selectedDateParam}
            calendarErrorRowIds={calendarErrorRowIds}
          />
        ) : (
          <p className="text-sm text-foreground/50">
            {isToday ? "本日" : `${formatDayShort(startOfSelectedDay)}`}、出勤予定・授業予定の登録はありません。
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
    </div>
  );
}
