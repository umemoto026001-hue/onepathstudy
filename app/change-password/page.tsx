import { redirect } from "next/navigation";
import { auth } from "@/auth";
import ChangePasswordForm from "@/components/ChangePasswordForm";

export default async function ChangePasswordPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-navy px-4">
      <div className="w-full max-w-sm rounded-2xl bg-offwhite p-8 shadow-xl">
        <div className="mb-6 text-center">
          <h1 className="font-heading text-2xl font-bold text-navy">パスワード変更</h1>
          {session.user.mustChangePassword ? (
            <p className="mt-2 text-sm text-coral">
              初回ログインのため、パスワードを変更してください。変更が完了するまで他の画面には進めません。
            </p>
          ) : (
            <p className="mt-1 text-sm text-navy/70">{session.user.name} さん</p>
          )}
        </div>
        <ChangePasswordForm />
      </div>
    </main>
  );
}
