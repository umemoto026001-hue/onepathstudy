import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Badge, LinkButton, PageHeader } from "@/components/ui";
import { getMonthGrid, getWeekDays, parseDateParam, shiftDate, toDateParam } from "@/lib/calendar";
import { formatDayShort, formatMonthLabel, formatTime } from "@/lib/date";
import { SCHEDULE_STATUS_BADGE, SCHEDULE_STATUS_LABEL } from "@/lib/labels";
import ScheduleStatusSelect from "@/components/ScheduleStatusSelect";
import clsx from "clsx";

type SearchParams = {
  view?: string;
  date?: string;
  scheduleId?: string;
};

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const view: "week" | "month" = params.view === "month" ? "month" : "week";
  const anchor = parseDateParam(params.date);
  const days = view === "week" ? getWeekDays(anchor) : getMonthGrid(anchor);
  const rangeStart = days[0];
  const rangeEnd = new Date(days[days.length - 1]);
  rangeEnd.setHours(23, 59, 59, 999);

  const schedules = await prisma.classSchedule.findMany({
    where: { startAt: { gte: rangeStart, lte: rangeEnd } },
    include: { student: true, subject: true, teacher: true },
    orderBy: { startAt: "asc" },
  });

  const byDay = new Map<string, typeof schedules>();
  for (const s of schedules) {
    const key = toDateParam(s.startAt);
    byDay.set(key, [...(byDay.get(key) ?? []), s]);
  }

  const prevDate = toDateParam(shiftDate(anchor, view, -1));
  const nextDate = toDateParam(shiftDate(anchor, view, 1));
  const todayDate = toDateParam(new Date());

  const linkFor = (overrides: Partial<SearchParams>) => {
    const merged = { view, date: toDateParam(anchor), ...params, ...overrides };
    const qs = new URLSearchParams();
    if (merged.view) qs.set("view", merged.view);
    if (merged.date) qs.set("date", merged.date);
    if (merged.scheduleId) qs.set("scheduleId", merged.scheduleId);
    return `/schedule?${qs.toString()}`;
  };

  return (
    <div>
      <PageHeader
        title="授業スケジュール"
        description={
          view === "week"
            ? `${formatDayShort(rangeStart)} 〜 ${formatDayShort(days[6])}`
            : formatMonthLabel(anchor)
        }
        actions={<LinkButton href="/schedule/new">+ 授業予定を登録する</LinkButton>}
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-full bg-navy/5 p-1">
          <Link
            href={linkFor({ view: "week", scheduleId: undefined })}
            className={clsx(
              "rounded-full px-4 py-1.5 text-sm font-medium",
              view === "week" ? "bg-white shadow-sm text-navy" : "text-navy/60",
            )}
          >
            週表示
          </Link>
          <Link
            href={linkFor({ view: "month", scheduleId: undefined })}
            className={clsx(
              "rounded-full px-4 py-1.5 text-sm font-medium",
              view === "month" ? "bg-white shadow-sm text-navy" : "text-navy/60",
            )}
          >
            月表示
          </Link>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Link href={linkFor({ date: prevDate, scheduleId: undefined })} className="rounded-lg border border-navy/20 px-3 py-1.5 text-navy hover:bg-navy/5">
            ← 前へ
          </Link>
          <Link href={linkFor({ date: todayDate, scheduleId: undefined })} className="rounded-lg border border-navy/20 px-3 py-1.5 text-navy hover:bg-navy/5">
            今日
          </Link>
          <Link href={linkFor({ date: nextDate, scheduleId: undefined })} className="rounded-lg border border-navy/20 px-3 py-1.5 text-navy hover:bg-navy/5">
            次へ →
          </Link>
        </div>
      </div>

      {view === "week" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-7">
          {days.map((day) => (
            <DayColumn
              key={day.toISOString()}
              day={day}
              schedules={byDay.get(toDateParam(day)) ?? []}
              linkFor={linkFor}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-7">
          {days.map((day) => (
            <MonthCell
              key={day.toISOString()}
              day={day}
              inMonth={day.getMonth() === anchor.getMonth()}
              schedules={byDay.get(toDateParam(day)) ?? []}
              linkFor={linkFor}
            />
          ))}
        </div>
      )}

      {params.scheduleId && (
        <ScheduleDetailModal id={params.scheduleId} closeHref={linkFor({ scheduleId: undefined })} />
      )}
    </div>
  );
}

function DayColumn({
  day,
  schedules,
  linkFor,
}: {
  day: Date;
  schedules: { id: string; startAt: Date; status: import("@prisma/client").ScheduleStatus; student: { name: string }; subject: { name: string } }[];
  linkFor: (o: Partial<SearchParams>) => string;
}) {
  const isToday = toDateParam(day) === toDateParam(new Date());
  return (
    <div className="rounded-xl border border-navy/10 bg-white">
      <div
        className={clsx(
          "rounded-t-xl px-3 py-2 text-sm font-medium",
          isToday ? "bg-coral text-white" : "bg-navy/5 text-navy",
        )}
      >
        {formatDayShort(day)}
      </div>
      <div className="space-y-1.5 p-2">
        {schedules.map((s) => (
          <Link
            key={s.id}
            href={linkFor({ scheduleId: s.id })}
            className="block rounded-lg bg-navy/5 px-2 py-1.5 text-xs hover:bg-navy/10"
          >
            <div className="font-medium text-navy">{formatTime(s.startAt)} {s.student.name}</div>
            <div className="flex items-center gap-1 text-foreground/60">
              <Badge>{s.subject.name}</Badge>
              <Badge color={SCHEDULE_STATUS_BADGE[s.status]}>{SCHEDULE_STATUS_LABEL[s.status]}</Badge>
            </div>
          </Link>
        ))}
        {schedules.length === 0 && <p className="px-2 py-1 text-xs text-foreground/30">-</p>}
      </div>
    </div>
  );
}

function MonthCell({
  day,
  inMonth,
  schedules,
  linkFor,
}: {
  day: Date;
  inMonth: boolean;
  schedules: { id: string; startAt: Date; student: { name: string } }[];
  linkFor: (o: Partial<SearchParams>) => string;
}) {
  const isToday = toDateParam(day) === toDateParam(new Date());
  const visible = schedules.slice(0, 3);
  const extra = schedules.length - visible.length;
  return (
    <div className={clsx("min-h-[90px] rounded-lg border border-navy/10 p-2", !inMonth && "bg-black/5 opacity-50")}>
      <div className={clsx("mb-1 text-xs font-medium", isToday ? "text-coral" : "text-navy/70")}>
        {day.getDate()}
      </div>
      <div className="space-y-1">
        {visible.map((s) => (
          <Link
            key={s.id}
            href={linkFor({ scheduleId: s.id })}
            className="block truncate rounded bg-navy/5 px-1.5 py-0.5 text-[11px] hover:bg-navy/10"
          >
            {formatTime(s.startAt)} {s.student.name}
          </Link>
        ))}
        {extra > 0 && <p className="text-[11px] text-foreground/50">+{extra}件</p>}
      </div>
    </div>
  );
}

async function ScheduleDetailModal({ id, closeHref }: { id: string; closeHref: string }) {
  const schedule = await prisma.classSchedule.findUnique({
    where: { id },
    include: { student: true, subject: true, teacher: true },
  });
  if (!schedule) notFound();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <h2 className="font-heading text-lg font-bold text-navy">授業予定の詳細</h2>
          <Link href={closeHref} className="text-foreground/40 hover:text-foreground">
            ✕
          </Link>
        </div>
        <dl className="space-y-3 text-sm">
          <Row label="生徒">
            <Link href={`/students/${schedule.studentId}`} className="text-coral underline">
              {schedule.student.name}
            </Link>
          </Row>
          <Row label="科目"><Badge>{schedule.subject.name}</Badge></Row>
          <Row label="日時">
            {formatDayShort(schedule.startAt)} {formatTime(schedule.startAt)} 〜 {formatTime(schedule.endAt)}
          </Row>
          <Row label="担当講師">{schedule.teacher.name}</Row>
          {schedule.meetingUrl && (
            <Row label="会議URL">
              <a href={schedule.meetingUrl} target="_blank" rel="noreferrer" className="break-all text-coral underline">
                {schedule.meetingUrl}
              </a>
            </Row>
          )}
          {schedule.isRecurring && <Row label="繰り返し">{schedule.recurrenceRule || "毎週固定枠"}</Row>}
          {schedule.note && <Row label="メモ"><span className="whitespace-pre-wrap">{schedule.note}</span></Row>}
          <Row label="ステータス">
            <ScheduleStatusSelect id={schedule.id} status={schedule.status} />
          </Row>
        </dl>
        <div className="mt-5">
          <LinkButton
            href={`/progress/new?studentId=${schedule.studentId}&scheduleId=${schedule.id}`}
            className="w-full justify-center"
          >
            この回の進捗を記録する
          </LinkButton>
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-medium text-navy/50">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
