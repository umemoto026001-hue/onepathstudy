"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { Campus, Student, Subject } from "@prisma/client";
import { Button, Card, Checkbox, Field, Input, Select } from "@/components/ui";
import { STUDENT_STATUS_LABEL } from "@/lib/labels";

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

export default function StudentForm({
  action,
  subjects,
  campuses,
  student,
  defaultStudentNumber,
  submitLabel,
}: {
  action: Action;
  subjects: Subject[];
  campuses: Campus[];
  student?: Student & { subjects: Subject[] };
  defaultStudentNumber?: string;
  submitLabel: string;
}) {
  const [error, formAction] = useActionState(action, undefined);
  const studentSubjectIds = new Set(student?.subjects.map((s) => s.id));

  return (
    <form action={formAction} className="space-y-6">
      <Card className="grid gap-4 sm:grid-cols-2">
        <Field label="生徒番号" htmlFor="studentNumber" required hint="自動採番されますが編集できます">
          <Input
            id="studentNumber"
            name="studentNumber"
            required
            defaultValue={student?.studentNumber ?? defaultStudentNumber}
          />
        </Field>
        <Field label="氏名" htmlFor="name" required>
          <Input id="name" name="name" required defaultValue={student?.name} />
        </Field>
        <Field label="志望校" htmlFor="targetSchool">
          <Input id="targetSchool" name="targetSchool" defaultValue={student?.targetSchool ?? ""} />
        </Field>
        <Field label="入会日" htmlFor="enrolledAt">
          <Input
            id="enrolledAt"
            name="enrolledAt"
            type="date"
            defaultValue={
              student?.enrolledAt ? new Date(student.enrolledAt).toISOString().slice(0, 10) : undefined
            }
          />
        </Field>
        <Field label="保護者連絡先" htmlFor="parentContact">
          <Input id="parentContact" name="parentContact" defaultValue={student?.parentContact ?? ""} />
        </Field>
        <Field label="校舎" htmlFor="campusId">
          <Select id="campusId" name="campusId" defaultValue={student?.campusId ?? ""}>
            <option value="">未設定</option>
            {campuses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="在籍ステータス" htmlFor="status" required>
          <Select id="status" name="status" required defaultValue={student?.status ?? "ENROLLED"}>
            {Object.entries(STUDENT_STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="受講科目">
          <div className="flex flex-wrap gap-2">
            {subjects.map((subject) => (
              <Checkbox
                key={subject.id}
                name="subjectIds"
                value={subject.id}
                label={subject.name}
                defaultChecked={studentSubjectIds.has(subject.id)}
              />
            ))}
          </div>
        </Field>
      </Card>

      {error && (
        <p className="rounded-md bg-coral/10 px-3 py-2 text-sm text-coral" role="alert">
          {error}
        </p>
      )}

      <SubmitButton label={submitLabel} />
    </form>
  );
}
