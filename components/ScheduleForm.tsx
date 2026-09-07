"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { Student, Subject, User } from "@prisma/client";
import { Button, Card, Checkbox, Field, Input, Select, Textarea } from "@/components/ui";
import { createSchedule } from "@/app/actions/schedule";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "登録中..." : "登録する"}
    </Button>
  );
}

export default function ScheduleForm({
  students,
  subjects,
  teachers,
  currentTeacherId,
  defaultStudentId,
}: {
  students: Student[];
  subjects: Subject[];
  teachers: User[];
  currentTeacherId: string;
  defaultStudentId?: string;
}) {
  const [error, formAction] = useActionState(createSchedule, undefined);

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
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="科目" htmlFor="subjectId" required>
          <Select id="subjectId" name="subjectId" required defaultValue="">
            <option value="" disabled>
              選択してください
            </option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="担当講師" htmlFor="teacherId" required>
          <Select id="teacherId" name="teacherId" required defaultValue={currentTeacherId}>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="オンライン会議URL" htmlFor="meetingUrl">
          <Input id="meetingUrl" name="meetingUrl" type="url" placeholder="https://" />
        </Field>
        <Field label="日付" htmlFor="date" required>
          <Input id="date" name="date" type="date" required />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="開始時刻" htmlFor="startTime" required>
            <Input id="startTime" name="startTime" type="time" required />
          </Field>
          <Field label="終了時刻" htmlFor="endTime" required>
            <Input id="endTime" name="endTime" type="time" required />
          </Field>
        </div>
        <Field label="繰り返し設定">
          <div className="space-y-2">
            <Checkbox name="isRecurring" label="毎週固定枠にする" />
            <Input
              name="recurrenceRule"
              placeholder="例: 毎週月曜19:00〜"
            />
          </div>
        </Field>
        <Field label="メモ" htmlFor="note">
          <Textarea id="note" name="note" rows={3} />
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
