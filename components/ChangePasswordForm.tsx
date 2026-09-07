"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { changePassword } from "@/app/actions/account";
import { Button, Field, Input } from "@/components/ui";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full justify-center">
      {pending ? "変更中..." : "パスワードを変更する"}
    </Button>
  );
}

export default function ChangePasswordForm() {
  const [error, formAction] = useActionState(changePassword, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <Field label="現在のパスワード" htmlFor="currentPassword" required>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
        />
      </Field>
      <Field label="新しいパスワード" htmlFor="newPassword" required hint="8文字以上">
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </Field>
      <Field label="新しいパスワード（確認）" htmlFor="confirmPassword" required>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </Field>
      {error && (
        <p className="rounded-md bg-coral/10 px-3 py-2 text-sm text-coral" role="alert">
          {error}
        </p>
      )}
      <SubmitButton />
    </form>
  );
}
