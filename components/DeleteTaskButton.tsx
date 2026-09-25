"use client";

import { useTransition } from "react";
import { deleteTask } from "@/app/actions/tasks";

export default function DeleteTaskButton({ id, title }: { id: string; title: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm(`「${title}」を削除します。よろしいですか？`)) {
          startTransition(async () => {
            try {
              await deleteTask(id);
            } catch (error) {
              alert(error instanceof Error ? error.message : "削除に失敗しました。");
            }
          });
        }
      }}
      className="text-xs text-coral underline disabled:opacity-50"
    >
      {pending ? "削除中..." : "削除"}
    </button>
  );
}
