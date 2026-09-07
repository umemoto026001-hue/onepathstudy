"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { Student } from "@prisma/client";
import { Button, Card, Field, Input, Select, Textarea } from "@/components/ui";
import { createInterview } from "@/app/actions/interviews";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "保存中..." : "記録する"}
    </Button>
  );
}

export default function InterviewForm({
  students,
  defaultStudentId,
}: {
  students: Student[];
  defaultStudentId?: string;
}) {
  const [error, formAction] = useActionState(createInterview, undefined);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="space-y-6">
      <Card className="grid gap-4 sm:grid-cols-2">
        <Field label="生徒" htmlFor="studentId" required>
          <Select id="studentId" name="studentId" required defaultValue={defaultStudentId ?? ""}>
            <option value="" disabled>
              選択してください
            </option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}（{s.studentNumber}）
              </option>
            ))}
          </Select>
        </Field>
        <Field label="面談日" htmlFor="date" required>
          <Input id="date" name="date" type="date" required defaultValue={today} />
        </Field>
      </Card>
      <Card>
        <Field label="面談内容（志望校までの進捗メモ）" htmlFor="content" required>
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
