"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button, Textarea } from "@/components/ui";
import { addHandoverNote } from "@/app/actions/students";

export default function HandoverNoteForm({ studentId }: { studentId: string }) {
  const action = addHandoverNote.bind(null, studentId);
  const [error, formAction, isPending] = useActionState(action, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !isPending && !error) {
      formRef.current?.reset();
    }
    wasPending.current = isPending;
  }, [isPending, error]);

  return (
    <form ref={formRef} action={formAction} className="space-y-2">
      <Textarea name="content" rows={2} placeholder="次に対応する人への申し送り事項を入力" required />
      {error && (
        <p className="rounded-md bg-coral/10 px-3 py-2 text-sm text-coral" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" disabled={isPending}>
        {isPending ? "投稿中..." : "投稿する"}
      </Button>
    </form>
  );
}
