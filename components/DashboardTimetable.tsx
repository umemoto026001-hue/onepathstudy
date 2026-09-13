import Link from "next/link";
import type { Role } from "@prisma/client";
import { Badge } from "@/components/ui";
import { ROLE_LABEL } from "@/lib/permissions";

export type TimetableBlock = { label: string; start: string; end: string };
export type TimetableRow = { userId: string; name: string; role: Role; blocks: TimetableBlock[] };
export type ScheduledTask = { id: string; title: string; slotStart: string | null; slotEnd: string | null };

const PX_PER_HOUR = 64;
const NAME_COL_WIDTH = 150;
const MIN_BLOCK_WIDTH = 28;

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export default function DashboardTimetable({
  rows,
  tasksByAssignee,
  todayParam,
}: {
  rows: TimetableRow[];
  tasksByAssignee: Map<string, ScheduledTask[]>;
  todayParam: string;
}) {
  if (rows.length === 0) {
    return null;
  }

  const allMinutes = rows.flatMap((row) => [
    ...row.blocks.flatMap((b) => [toMinutes(b.start), toMinutes(b.end)]),
    ...(tasksByAssignee.get(row.userId) ?? [])
      .filter((t): t is ScheduledTask & { slotStart: string; slotEnd: string } => !!t.slotStart && !!t.slotEnd)
      .flatMap((t) => [toMinutes(t.slotStart), toMinutes(t.slotEnd)]),
  ]);

  const startHour = Math.max(0, Math.floor(Math.min(...allMinutes) / 60));
  const endHour = Math.min(24, Math.max(startHour + 4, Math.ceil(Math.max(...allMinutes) / 60)));
  const timelineStartMinutes = startHour * 60;
  const hourCount = endHour - startHour;
  const timelineWidth = hourCount * PX_PER_HOUR;
  const hours = Array.from({ length: hourCount + 1 }, (_, i) => startHour + i);
  const leftPx = (minutes: number) => ((minutes - timelineStartMinutes) / 60) * PX_PER_HOUR;
  const widthPx = (startMinutes: number, endMinutes: number) =>
    Math.max(leftPx(endMinutes) - leftPx(startMinutes), MIN_BLOCK_WIDTH);

  return (
    <div className="overflow-x-auto">
      <div style={{ width: NAME_COL_WIDTH + timelineWidth }}>
        <div className="flex">
          <div className="sticky left-0 z-10 shrink-0 bg-white" style={{ width: NAME_COL_WIDTH }} />
          <div className="relative h-6 shrink-0" style={{ width: timelineWidth }}>
            {hours.map((h) => (
              <span
                key={h}
                className="absolute text-xs text-foreground/50"
                style={{ left: leftPx(h * 60) }}
              >
                {h}:00
              </span>
            ))}
          </div>
        </div>

        {rows.map((row) => {
          const tasks = tasksByAssignee.get(row.userId) ?? [];
          const timedTasks = tasks.filter((t) => t.slotStart && t.slotEnd);
          const untimedTasks = tasks.filter((t) => !t.slotStart || !t.slotEnd);
          const firstBlock = row.blocks[0];

          return (
            <div key={row.userId} className="border-t border-navy/10 py-2">
              <div className="flex">
                <div
                  className="sticky left-0 z-10 flex shrink-0 flex-col justify-center gap-1 bg-white pr-2"
                  style={{ width: NAME_COL_WIDTH }}
                >
                  <span className="truncate text-sm font-medium text-navy">{row.name}</span>
                  <div className="flex items-center gap-1.5">
                    <Badge>{ROLE_LABEL[row.role]}</Badge>
                    <Link
                      href={`/tasks/new?assigneeId=${row.userId}&date=${todayParam}&start=${firstBlock.start}&end=${firstBlock.end}`}
                      className="text-xs text-coral underline"
                      title="この人にタスクを貼る"
                    >
                      ＋タスク
                    </Link>
                  </div>
                </div>

                <div className="relative shrink-0" style={{ width: timelineWidth, minHeight: 48 }}>
                  {hours.map((h) => (
                    <div
                      key={h}
                      className="absolute inset-y-0 border-l border-navy/5"
                      style={{ left: leftPx(h * 60) }}
                    />
                  ))}
                  {row.blocks.map((b, i) => (
                    <div
                      key={i}
                      className="absolute top-0 flex h-5 items-center overflow-hidden rounded bg-navy/15 px-1.5 text-[11px] font-medium whitespace-nowrap text-navy"
                      style={{ left: leftPx(toMinutes(b.start)), width: widthPx(toMinutes(b.start), toMinutes(b.end)) }}
                      title={`${b.start}〜${b.end} ${b.label}`}
                    >
                      {b.label}
                    </div>
                  ))}
                  {timedTasks.map((t) => (
                    <Link
                      key={t.id}
                      href="/tasks"
                      className="absolute top-6 flex h-5 items-center overflow-hidden rounded bg-coral/20 px-1.5 text-[11px] font-medium whitespace-nowrap text-coral hover:bg-coral/30"
                      style={{
                        left: leftPx(toMinutes(t.slotStart!)),
                        width: widthPx(toMinutes(t.slotStart!), toMinutes(t.slotEnd!)),
                      }}
                      title={`${t.slotStart}〜${t.slotEnd} ${t.title}`}
                    >
                      {t.title}
                    </Link>
                  ))}
                </div>
              </div>

              {untimedTasks.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1.5" style={{ paddingLeft: NAME_COL_WIDTH }}>
                  {untimedTasks.map((t) => (
                    <Link
                      key={t.id}
                      href="/tasks"
                      className="inline-flex items-center rounded-full bg-coral/10 px-2.5 py-1 text-xs text-coral"
                    >
                      {t.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
