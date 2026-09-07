"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { resetPassword } from "@/app/actions/settings";

export default function ResetPasswordButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm(`「${name}」さんのパスワードを初期値「onepath」にリセットします。よろしいですか？`)) {
          startTransition(async () => {
            await resetPassword(id);
            router.refresh();
          });
        }
      }}
      className="text-sm text-navy underline disabled:opacity-50"
    >
      {pending ? "リセット中..." : "パスワードをリセット"}
    </button>
  );
}
