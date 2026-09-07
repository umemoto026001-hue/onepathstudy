"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { Student, Subject } from "@prisma/client";
import { Button, Card, Checkbox, Field, Input, Select, Textarea } from "@/components/ui";
import { GRADE_LABEL, STUDENT_STATUS_LABEL } from "@/lib/labels";

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
  universities,
  student,
  submitLabel,
}: {
  action: Action;
  subjects: Subject[];
  universities: { id: string; name: string }[];
  student?: Student & { subjects: Subject[] };
  submitLabel: string;
}) {
  const [error, formAction] = useActionState(action, undefined);
  const studentSubjectIds = new Set(student?.subjects.map((s) => s.id));

  return (
    <form action={formAction} className="space-y-6">
      <Card className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="氏名" htmlFor="name" required>
            <Input id="name" name="name" required defaultValue={student?.name} />
          </Field>
          <Field label="学年" htmlFor="grade" required>
            <Select id="grade" name="grade" required defaultValue={student?.grade ?? "G1"}>
              {Object.entries(GRADE_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="在籍ステータス" htmlFor="status" required>
            <Select
              id="status"
              name="status"
              required
              defaultValue={student?.status ?? "CONSIDERING"}
            >
              {Object.entries(STUDENT_STATUS_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="入会日" htmlFor="enrolledAt">
            <Input
              id="enrolledAt"
              name="enrolledAt"
              type="date"
              defaultValue={
                student?.enrolledAt
                  ? new Date(student.enrolledAt).toISOString().slice(0, 10)
                  : undefined
              }
            />
          </Field>
          <Field label="志望大学" htmlFor="targetUniversity">
            <Input
              id="targetUniversity"
              name="targetUniversity"
              list="university-options"
              defaultValue={student?.targetUniversity ?? ""}
            />
            <datalist id="university-options">
              {universities.map((u) => (
                <option key={u.id} value={u.name} />
              ))}
            </datalist>
          </Field>
          <Field label="志望学部" htmlFor="targetFaculty">
            <Input
              id="targetFaculty"
              name="targetFaculty"
              defaultValue={student?.targetFaculty ?? ""}
            />
          </Field>
        </div>

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

      <Card className="space-y-4">
        <h2 className="font-heading text-lg font-bold text-navy">連絡先</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="保護者氏名" htmlFor="parentName">
            <Input id="parentName" name="parentName" defaultValue={student?.parentName ?? ""} />
          </Field>
          <Field label="保護者連絡先" htmlFor="parentContact">
            <Input
              id="parentContact"
              name="parentContact"
              defaultValue={student?.parentContact ?? ""}
            />
          </Field>
          <Field label="生徒本人の連絡先" htmlFor="studentContact">
            <Input
              id="studentContact"
              name="studentContact"
              defaultValue={student?.studentContact ?? ""}
            />
          </Field>
        </div>
      </Card>

      <Card>
        <Field label="メモ" htmlFor="memo">
          <Textarea id="memo" name="memo" rows={4} defaultValue={student?.memo ?? ""} />
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
