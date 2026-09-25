"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { User } from "@prisma/client";
import { Button, Card, Field, Input, Select, Textarea } from "@/components/ui";
import { createSchedule } from "@/app/actions/schedules";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "登録中..." : "登録する"}
    </Button>
  );
}

export default function ScheduleForm({
  users,
  defaults,
}: {
  users: User[];
  defaults?: { ownerId?: string; date?: string; start?: string; end?: string };
}) {
  const [error, formAction] = useActionState(createSchedule, undefined);

  return (
    <form action={formAction} className="space-y-6">
      <Card className="grid gap-4 sm:grid-cols-2">
        <Field label="タイトル" htmlFor="title" required hint="例: 本部で会議、出張、来客対応">
          <Input id="title" name="title" required />
        </Field>
        <Field label="対象者" htmlFor="ownerId" required>
          <Select id="ownerId" name="ownerId" required defaultValue={defaults?.ownerId ?? ""}>
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
        <Field label="日付" htmlFor="date" required>
          <Input id="date" name="date" type="date" required defaultValue={defaults?.date} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="開始時刻" htmlFor="startTime" required>
            <Input id="startTime" name="startTime" type="time" required defaultValue={defaults?.start} />
          </Field>
          <Field label="終了時刻" htmlFor="endTime" required>
            <Input id="endTime" name="endTime" type="time" required defaultValue={defaults?.end} />
          </Field>
        </div>
      </Card>
      <Card>
        <Field label="メモ" htmlFor="note">
          <Textarea id="note" name="note" rows={4} />
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
