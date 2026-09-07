"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { Campus, User } from "@prisma/client";
import { Button, Card, Field, Input, Select } from "@/components/ui";
import { ROLE_LABEL } from "@/lib/permissions";

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
  campuses,
  user,
  submitLabel,
  onCancelHref,
}: {
  action: Action;
  campuses: Campus[];
  user?: User;
  submitLabel: string;
  onCancelHref?: string;
}) {
  const [error, formAction] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <Card className="grid gap-4 sm:grid-cols-2">
        <Field label="氏名" htmlFor="name" required>
          <Input id="name" name="name" required defaultValue={user?.name} />
        </Field>
        <Field label="社員番号" htmlFor="employeeNumber" required hint="ログインIDとして使用します">
          <Input id="employeeNumber" name="employeeNumber" required defaultValue={user?.employeeNumber} />
        </Field>
        <Field label="役職" htmlFor="role" required>
          <Select id="role" name="role" required defaultValue={user?.role ?? "TEACHER"}>
            {Object.entries(ROLE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="所属校舎" htmlFor="campusId">
          <Select id="campusId" name="campusId" defaultValue={user?.campusId ?? ""}>
            <option value="">未設定</option>
            {campuses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
      </Card>

      {!user && (
        <p className="text-sm text-foreground/60">
          初期パスワードは全員共通の「onepath」になります。初回ログイン時にパスワード変更が必須です。
        </p>
      )}

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
