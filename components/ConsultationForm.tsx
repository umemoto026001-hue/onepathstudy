"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { Student, User } from "@prisma/client";
import { Button, Card, Field, Input, Select, Textarea } from "@/components/ui";
import { createConsultation } from "@/app/actions/consultations";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "投稿中..." : "投稿する"}
    </Button>
  );
}

export default function ConsultationForm({
  users,
  students,
}: {
  users: User[];
  students: Student[];
}) {
  const [error, formAction] = useActionState(createConsultation, undefined);

  return (
    <form action={formAction} className="space-y-6">
      <Card className="grid gap-4 sm:grid-cols-2">
        <Field label="件名" htmlFor="title" required>
          <Input id="title" name="title" required />
        </Field>
        <Field label="担当者" htmlFor="assigneeId" required hint="投稿すると担当者に通知（未読バッジ）で知らせます">
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
        <Field label="関連する生徒" htmlFor="studentId" hint="任意">
          <Select id="studentId" name="studentId" defaultValue="">
            <option value="">なし</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}（{s.studentNumber}）
              </option>
            ))}
          </Select>
        </Field>
      </Card>
      <Card>
        <Field label="相談・クレーム内容" htmlFor="content" required>
          <Textarea id="content" name="content" rows={6} required />
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
