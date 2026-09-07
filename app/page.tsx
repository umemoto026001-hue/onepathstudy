import { redirect } from "next/navigation";
import { auth } from "@/auth";
import LoginForm from "@/components/LoginForm";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-navy px-4">
      <div className="w-full max-w-sm rounded-2xl bg-offwhite p-8 shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="font-heading text-2xl font-bold text-navy">
            One Path Study
          </h1>
          <p className="mt-1 text-sm text-navy/70">基幹管理システム</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
