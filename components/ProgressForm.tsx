"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { Student, Subject, User } from "@prisma/client";
import { Button, Card, Field, Input, Select, Textarea } from "@/components/ui";
import { UNDERSTANDING_LABEL } from "@/lib/labels";
import { createProgressLog } from "@/app/actions/progress";
import ProblemPicker from "@/components/ProblemPicker";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "保存中..." : "記録する"}
    </Button>
  );
}

export default function ProgressForm({
  students,
  subjects,
  teachers,
  currentTeacherId,
  defaultStudentId,
  defaultSubjectId,
  defaultDate,
  relatedScheduleId,
}: {
  students: Student[];
  subjects: Subject[];
  teachers: User[];
  currentTeacherId: string;
  defaultStudentId?: string;
  defaultSubjectId?: string;
  defaultDate?: string;
  relatedScheduleId?: string;
}) {
  const [error, formAction] = useActionState(createProgressLog, undefined);

  return (
    <form action={formAction} className="space-y-6">
      {relatedScheduleId && (
        <input type="hidden" name="relatedScheduleId" value={relatedScheduleId} />
      )}
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
          <Select id="subjectId" name="subjectId" required defaultValue={defaultSubjectId ?? ""}>
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
        <Field label="記録日" htmlFor="date" required>
          <Input id="date" name="date" type="date" required defaultValue={defaultDate} />
        </Field>
        <Field label="理解度" htmlFor="understandingLevel">
          <Select id="understandingLevel" name="understandingLevel" defaultValue="">
            <option value="">未設定</option>
            {Object.entries(UNDERSTANDING_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
      </Card>

      <Card>
        <Field label="今回扱った内容" htmlFor="coveredContent" required hint="単元・使用した演習問題などを記載してください">
          <Textarea id="coveredContent" name="coveredContent" rows={5} required />
        </Field>
      </Card>

      <Card>
        <Field label="使用した演習問題">
          <ProblemPicker />
        </Field>
      </Card>

      <Card className="space-y-4">
        <Field label="宿題・次回までの課題" htmlFor="homework">
          <Textarea id="homework" name="homework" rows={3} />
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
