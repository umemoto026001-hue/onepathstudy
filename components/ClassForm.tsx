"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { Campus, Class, Subject, User } from "@prisma/client";
import { Button, Card, Field, Input, Select } from "@/components/ui";
import { CLASS_MODE_LABEL, WEEKDAY_LABEL, WEEKDAY_ORDER } from "@/lib/labels";

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

export default function ClassForm({
  action,
  subjects,
  teachers,
  campuses,
  klass,
  submitLabel,
}: {
  action: Action;
  subjects: Subject[];
  teachers: User[];
  campuses: Campus[];
  klass?: Class;
  submitLabel: string;
}) {
  const [error, formAction] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-6">
      <Card className="grid gap-4 sm:grid-cols-2">
        <Field label="クラス名" htmlFor="name" required hint="例: 英語基礎クラス火19時">
          <Input id="name" name="name" required defaultValue={klass?.name} />
        </Field>
        <Field label="科目" htmlFor="subjectId" required>
          <Select id="subjectId" name="subjectId" required defaultValue={klass?.subjectId ?? ""}>
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
        <Field label="レベル" htmlFor="level" required hint="例: 基礎, 標準, 応用">
          <Input id="level" name="level" required defaultValue={klass?.level} />
        </Field>
        <Field label="担当講師" htmlFor="teacherId" required>
          <Select id="teacherId" name="teacherId" required defaultValue={klass?.teacherId ?? ""}>
            <option value="" disabled>
              選択してください
            </option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="曜日" htmlFor="weekday" required>
          <Select id="weekday" name="weekday" required defaultValue={klass?.weekday ?? "MON"}>
            {WEEKDAY_ORDER.map((w) => (
              <option key={w} value={w}>
                {WEEKDAY_LABEL[w]}曜日
              </option>
            ))}
          </Select>
        </Field>
        <Field label="形式" htmlFor="mode" required>
          <Select id="mode" name="mode" required defaultValue={klass?.mode ?? "ONLINE"}>
            {Object.entries(CLASS_MODE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="開始時刻" htmlFor="startTime" required>
            <Input id="startTime" name="startTime" type="time" required defaultValue={klass?.startTime} />
          </Field>
          <Field label="終了時刻" htmlFor="endTime" required>
            <Input id="endTime" name="endTime" type="time" required defaultValue={klass?.endTime} />
          </Field>
        </div>
        <Field label="校舎" htmlFor="campusId" hint="対面授業の場合など">
          <Select id="campusId" name="campusId" defaultValue={klass?.campusId ?? ""}>
            <option value="">未設定</option>
            {campuses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
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
