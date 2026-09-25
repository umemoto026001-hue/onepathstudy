import ical, { type VEvent } from "node-ical";

export type CalendarEvent = { label: string; start: string; end: string };

function formatHm(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function summaryText(summary: VEvent["summary"]) {
  if (typeof summary === "string") return summary;
  return summary?.val ?? "(予定)";
}

/**
 * 指定した日の予定を ICS URL（Google カレンダーの「非公開URL」等）から取得する。
 * 終日予定はタイムテーブル（時間軸）に乗せられないため除外する。
 * ネットワークエラー・パースエラーはすべて呼び出し側に例外として伝える
 * （呼び出し側で握りつぶしてダッシュボード全体を壊さないようにする）。
 */
export async function fetchCalendarEventsForDay(icsUrl: string, day: Date): Promise<CalendarEvent[]> {
  const startOfDay = new Date(day);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const res = await fetch(icsUrl, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) {
    throw new Error(`カレンダーの取得に失敗しました（HTTP ${res.status}）`);
  }
  const text = await res.text();
  const data = ical.sync.parseICS(text);

  const events: CalendarEvent[] = [];
  for (const item of Object.values(data)) {
    if (!item || typeof item !== "object" || (item as { type?: string }).type !== "VEVENT") continue;
    const instances = ical.expandRecurringEvent(item as VEvent, { from: startOfDay, to: endOfDay });
    for (const instance of instances) {
      if (instance.isFullDay) continue;
      if (instance.start >= endOfDay || instance.end <= startOfDay) continue;
      events.push({
        label: summaryText(instance.event.summary),
        start: formatHm(instance.start < startOfDay ? startOfDay : instance.start),
        end: formatHm(instance.end > endOfDay ? endOfDay : instance.end),
      });
    }
  }

  return events.sort((a, b) => a.start.localeCompare(b.start));
}
