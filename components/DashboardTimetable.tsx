import Link from "next/link";
import clsx from "clsx";
import type { Role } from "@prisma/client";
import { Badge } from "@/components/ui";
import { ROLE_LABEL } from "@/lib/permissions";
import ScheduleBlock from "@/components/ScheduleBlock";

export type TimetableBlock = {
  label: string;
  start: string;
  end: string;
  kind?: "shift" | "class" | "calendar" | "schedule";
  id?: string;
  deletable?: boolean;
};
export type TimetableRow = { userId: string; name: string; role: Role; blocks: TimetableBlock[] };
export type ScheduledTask = { id: string; title: string; slotStart: string | null; slotEnd: string | null };

const PX_PER_HOUR = 110;
const NAME_COL_WIDTH = 190;
const MIN_BLOCK_WIDTH = 40;
const BLOCK_HEIGHT = 28;
const TIER_HEIGHT = 34;

const KIND_CLASS: Record<string, string> = {
  calendar: "bg-emerald-500/15 text-emerald-700",
  schedule: "bg-violet-500/15 text-violet-700",
  task: "bg-coral/20 text-coral hover:bg-coral/30",
};

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

type TimelineItem = {
  key: string;
  label: string;
  start: string;
  end: string;
  startMin: number;
  endMin: number;
  kind: "shift" | "class" | "calendar" | "schedule" | "task";
  id?: string;
  deletable?: boolean;
};

/** 時間が重なるアイテムを段（tier）に振り分ける（区間グラフの貪欲彩色）。 */
function assignTiers(items: TimelineItem[]) {
  const sorted = [...items].sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);
  const tierEnds: number[] = [];
  const tierOf = new Map<string, number>();
  for (const item of sorted) {
    let tier = tierEnds.findIndex((end) => end <= item.startMin);
    if (tier === -1) {
      tier = tierEnds.length;
      tierEnds.push(item.endMin);
    } else {
      tierEnds[tier] = item.endMin;
    }
    tierOf.set(item.key, tier);
  }
  return { tierOf, tierCount: tierEnds.length };
}

export default function DashboardTimetable({
  rows,
  tasksByAssignee,
  dateParam,
  calendarErrorRowIds,
}: {
  rows: TimetableRow[];
  tasksByAssignee: Map<string, ScheduledTask[]>;
  dateParam: string;
  calendarErrorRowIds?: Set<string>;
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
          <div className="relative h-8 shrink-0" style={{ width: timelineWidth }}>
            {hours.map((h) => (
              <span
                key={h}
                className="absolute text-base text-foreground/50"
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

          const items: TimelineItem[] = [
            ...row.blocks.map((b, i) => ({
              key: `b${i}`,
              label: b.label,
              start: b.start,
              end: b.end,
              startMin: toMinutes(b.start),
              endMin: toMinutes(b.end),
              kind: b.kind ?? "shift",
              id: b.id,
              deletable: b.deletable,
            })),
            ...timedTasks.map((t) => ({
              key: `t${t.id}`,
              label: t.title,
              start: t.slotStart!,
              end: t.slotEnd!,
              startMin: toMinutes(t.slotStart!),
              endMin: toMinutes(t.slotEnd!),
              kind: "task" as const,
              id: t.id,
            })),
          ];
          const { tierOf, tierCount } = assignTiers(items);
          const rowMinHeight = Math.max(BLOCK_HEIGHT + 8, tierCount * TIER_HEIGHT + 8);

          return (
            <div key={row.userId} className="border-t border-navy/10 py-4">
              <div className="flex">
                <div
                  className="sticky left-0 z-10 flex shrink-0 flex-col justify-center gap-1.5 bg-white pr-2"
                  style={{ width: NAME_COL_WIDTH }}
                >
                  <span className="flex items-center gap-1 truncate text-lg font-medium text-navy">
                    {row.name}
                    {calendarErrorRowIds?.has(row.userId) && (
                      <span
                        className="rounded bg-coral/10 px-1 text-[10px] font-medium text-coral"
                        title="Googleカレンダーの取得に失敗しています（個人設定でURLを確認してください）"
                      >
                        連携エラー
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Badge>{ROLE_LABEL[row.role]}</Badge>
                    <Link
                      href={`/tasks/new?assigneeId=${row.userId}&date=${dateParam}&start=${firstBlock.start}&end=${firstBlock.end}`}
                      className="text-xs text-coral underline"
                      title="この人にタスクを貼る"
                    >
                      ＋タスク
                    </Link>
                    <Link
                      href={`/schedules/new?ownerId=${row.userId}&date=${dateParam}&start=${firstBlock.start}&end=${firstBlock.end}`}
                      className="text-xs text-navy underline"
                      title="この人に予定を貼る"
                    >
                      ＋予定
                    </Link>
                  </div>
                </div>

                <div className="relative shrink-0" style={{ width: timelineWidth, minHeight: rowMinHeight }}>
                  {hours.map((h) => (
                    <div
                      key={h}
                      className="absolute inset-y-0 border-l border-navy/5"
                      style={{ left: leftPx(h * 60) }}
                    />
                  ))}
                  {items.map((item) => {
                    const style = {
                      left: leftPx(item.startMin),
                      top: tierOf.get(item.key)! * TIER_HEIGHT,
                      minWidth: widthPx(item.startMin, item.endMin),
                    };
                    const title = `${item.start}〜${item.end} ${item.label}${item.kind === "calendar" ? "（Googleカレンダー）" : ""}`;

                    if (item.kind === "schedule" && item.deletable && item.id) {
                      return (
                        <ScheduleBlock
                          key={item.key}
                          id={item.id}
                          label={item.label}
                          title={`${title}（クリックで削除）`}
                          style={style}
                        />
                      );
                    }
                    if (item.kind === "task") {
                      return (
                        <Link
                          key={item.key}
                          href="/tasks"
                          className={clsx(
                            "absolute z-[1] flex items-center whitespace-nowrap rounded px-1.5 text-sm font-medium hover:z-[2]",
                            KIND_CLASS.task,
                          )}
                          style={{ ...style, height: BLOCK_HEIGHT }}
                          title={title}
                        >
                          {item.label}
                        </Link>
                      );
                    }
                    return (
                      <div
                        key={item.key}
                        className={clsx(
                          "absolute z-[1] flex items-center whitespace-nowrap rounded px-1.5 text-sm font-medium",
                          KIND_CLASS[item.kind] ?? "bg-navy/15 text-navy",
                        )}
                        style={{ ...style, height: BLOCK_HEIGHT }}
                        title={title}
                      >
                        {item.label}
                      </div>
                    );
                  })}
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
