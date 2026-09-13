"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { Task, User } from "@prisma/client";
import { Button, Card, Field, Input, Select, Textarea } from "@/components/ui";
import { toDateParam } from "@/lib/date";

type Action = (
  prevState: string | undefined,
  formData: FormData,
) => Promise<string | undefined>;

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "保存中..." : label}
    </Button>
  );
}

export default function TaskForm({
  action,
  users,
  task,
  submitLabel = "登録する",
  defaults,
  onCancelHref,
}: {
  action: Action;
  users: User[];
  task?: Task;
  submitLabel?: string;
  defaults?: { assigneeId?: string; scheduledDate?: string; slotStart?: string; slotEnd?: string };
  onCancelHref?: string;
}) {
  const [error, formAction] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-6">
      <Card className="grid gap-4 sm:grid-cols-2">
        <Field label="タイトル" htmlFor="title" required>
          <Input id="title" name="title" required defaultValue={task?.title} />
        </Field>
        <Field label="担当者" htmlFor="assigneeId" required>
          <Select
            id="assigneeId"
            name="assigneeId"
            required
            defaultValue={task?.assigneeId ?? defaults?.assigneeId ?? ""}
          >
            <option value="" disabled>
              選択してください
            </option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="期限" htmlFor="dueDate" hint="任意">
          <Input
            id="dueDate"
            name="dueDate"
            type="date"
            defaultValue={task?.dueDate ? toDateParam(task.dueDate) : undefined}
          />
        </Field>
      </Card>
      <Card className="grid gap-4 sm:grid-cols-3">
        <Field
          label="タイムテーブルに配置する日"
          htmlFor="scheduledDate"
          hint="任意。指定するとダッシュボードの本日のタイムテーブルに表示されます"
        >
          <Input
            id="scheduledDate"
            name="scheduledDate"
            type="date"
            defaultValue={
              task?.scheduledDate
                ? toDateParam(task.scheduledDate)
                : defaults?.scheduledDate
            }
          />
        </Field>
        <Field label="開始時刻" htmlFor="slotStart" hint="任意">
          <Input
            id="slotStart"
            name="slotStart"
            type="time"
            defaultValue={task?.slotStart ?? defaults?.slotStart ?? ""}
          />
        </Field>
        <Field label="終了時刻" htmlFor="slotEnd" hint="任意">
          <Input
            id="slotEnd"
            name="slotEnd"
            type="time"
            defaultValue={task?.slotEnd ?? defaults?.slotEnd ?? ""}
          />
        </Field>
      </Card>
      <Card>
        <Field label="内容" htmlFor="description">
          <Textarea id="description" name="description" rows={5} defaultValue={task?.description ?? ""} />
        </Field>
      </Card>
      {error && (
        <p className="rounded-md bg-coral/10 px-3 py-2 text-sm text-coral" role="alert">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <SubmitButton label={submitLabel} />
        {onCancelHref && (
          <a
            href={onCancelHref}
            className="inline-flex items-center justify-center rounded-lg border border-navy/20 px-4 py-2.5 text-sm font-bold text-navy hover:bg-navy/5"
          >
            キャンセル
          </a>
        )}
      </div>
    </form>
  );
}
