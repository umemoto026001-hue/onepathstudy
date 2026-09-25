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
      className="absolute z-[1] overflow-hidden rounded bg-violet-500/15 text-violet-700 hover:bg-violet-500/25 disabled:opacity-50"
      style={style}
    >
      {/* line-clamp on the <button> itself doesn't apply (form controls override display),
          so the clamp is applied on this inner span instead. */}
      <span className="px-1.5 py-1 text-left text-xs font-medium leading-snug line-clamp-2">{label}</span>
    </button>
  );
}
