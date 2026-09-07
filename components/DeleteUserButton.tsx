"use client";

import { useTransition } from "react";
import { deleteUser } from "@/app/actions/settings";

export default function DeleteUserButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm(`「${name}」さんのアカウントを削除します。よろしいですか？`)) {
          startTransition(async () => {
            try {
              await deleteUser(id);
            } catch (error) {
              alert(error instanceof Error ? error.message : "削除に失敗しました。");
            }
          });
        }
      }}
      className="text-sm text-coral underline disabled:opacity-50"
    >
      {pending ? "削除中..." : "削除"}
    </button>
  );
}
