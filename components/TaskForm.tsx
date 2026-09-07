"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { User } from "@prisma/client";
import { Button, Card, Field, Input, Select, Textarea } from "@/components/ui";
import { createTask } from "@/app/actions/tasks";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "登録中..." : "登録する"}
    </Button>
  );
}

export default function TaskForm({ users }: { users: User[] }) {
  const [error, formAction] = useActionState(createTask, undefined);

  return (
    <form action={formAction} className="space-y-6">
      <Card className="grid gap-4 sm:grid-cols-2">
        <Field label="タイトル" htmlFor="title" required>
          <Input id="title" name="title" required />
        </Field>
        <Field label="担当者" htmlFor="assigneeId" required>
          <Select id="assigneeId" name="assigneeId" required defaultValue="">
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
          <Input id="dueDate" name="dueDate" type="date" />
        </Field>
      </Card>
      <Card>
        <Field label="内容" htmlFor="description">
          <Textarea id="description" name="description" rows={5} />
        </Field>
      </Card>
      {error && (
        <p className="rounded-md bg-coral/10 px-3 py-2 text-sm text-coral" role="alert">
          {error}
        </p>
      )}
      <SubmitButton />
    </form>
  );
}
