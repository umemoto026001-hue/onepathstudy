"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { authenticate } from "@/app/actions/auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-coral px-4 py-3 font-bold text-white transition hover:opacity-90 disabled:opacity-60"
    >
      {pending ? "ログイン中..." : "ログイン"}
    </button>
  );
}

export default function LoginForm() {
  const [errorMessage, formAction] = useActionState(authenticate, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="employeeNumber" className="mb-1 block text-sm font-medium text-navy">
          社員番号
        </label>
        <input
          id="employeeNumber"
          name="employeeNumber"
          type="text"
          required
          autoComplete="username"
          inputMode="numeric"
          className="w-full rounded-lg border border-navy/20 bg-white px-4 py-2.5 text-foreground focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/30"
          placeholder="例: 026001"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium text-navy">
          パスワード
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-lg border border-navy/20 bg-white px-4 py-2.5 text-foreground focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/30"
          placeholder="••••••••"
        />
      </div>
      {errorMessage && (
        <p className="rounded-md bg-coral/10 px-3 py-2 text-sm text-coral" role="alert">
          {errorMessage}
        </p>
      )}
      <SubmitButton />
    </form>
  );
}
