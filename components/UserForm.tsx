"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { Subject, User } from "@prisma/client";
import { Button, Card, Checkbox, Field, Input, Select } from "@/components/ui";

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

export default function UserForm({
  action,
  subjects,
  user,
  submitLabel,
  onCancelHref,
}: {
  action: Action;
  subjects: Subject[];
  user?: User & { subjects: Subject[] };
  submitLabel: string;
  onCancelHref?: string;
}) {
  const [error, formAction] = useActionState(action, undefined);
  const userSubjectIds = new Set(user?.subjects.map((s) => s.id));

  return (
    <form action={formAction} className="space-y-4">
      <Card className="grid gap-4 sm:grid-cols-2">
        <Field label="氏名" htmlFor="name" required>
          <Input id="name" name="name" required defaultValue={user?.name} />
        </Field>
        <Field label="メールアドレス" htmlFor="email" required>
          <Input id="email" name="email" type="email" required defaultValue={user?.email} />
        </Field>
        <Field label="権限区分" htmlFor="role" required>
          <Select id="role" name="role" required defaultValue={user?.role ?? "ADMIN"}>
            <option value="ADMIN">管理者</option>
            <option value="TEACHER">講師</option>
          </Select>
        </Field>
        <Field
          label={user ? "パスワード再設定" : "初期パスワード"}
          htmlFor="password"
          required={!user}
          hint={user ? "変更する場合のみ入力してください（6文字以上）" : "6文字以上"}
        >
          <Input id="password" name="password" type="password" required={!user} />
        </Field>
        <Field label="担当科目">
          <div className="flex flex-wrap gap-2">
            {subjects.map((subject) => (
              <Checkbox
                key={subject.id}
                name="subjectIds"
                value={subject.id}
                label={subject.name}
                defaultChecked={userSubjectIds.has(subject.id)}
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
