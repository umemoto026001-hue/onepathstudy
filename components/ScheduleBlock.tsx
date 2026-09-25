"use client";

import { useTransition, type CSSProperties } from "react";
import { deleteSchedule } from "@/app/actions/schedules";

export default function ScheduleBlock({
  id,
  label,
  title,
  style,
}: {
  id: string;
  label: string;
  title: string;
  style: CSSProperties;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      title={title}
      onClick={() => {
        if (confirm(`「${label}」を削除します。よろしいですか？`)) {
          startTransition(async () => {
            try {
              await deleteSchedule(id);
            } catch (error) {
              alert(error instanceof Error ? error.message : "削除に失敗しました。");
            }
          });
        }
      }}
      className="absolute top-0 z-[1] flex h-6 items-center whitespace-nowrap rounded bg-violet-500/15 px-1.5 text-xs font-medium text-violet-700 hover:bg-violet-500/25 disabled:opacity-50"
      style={style}
    >
      {label}
    </button>
  );
}
