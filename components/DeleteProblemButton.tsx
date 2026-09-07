"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui";
import { deleteProblem } from "@/app/actions/problems";

export default function DeleteProblemButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="danger"
      disabled={pending}
      onClick={() => {
        if (confirm("この演習問題を削除します。よろしいですか？")) {
          startTransition(() => deleteProblem(id));
        }
      }}
    >
      {pending ? "削除中..." : "削除する"}
    </Button>
  );
}
