import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { logout } from "@/app/actions/auth";
import NavBar from "@/components/NavBar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-navy text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <span className="font-heading text-lg font-bold">
              One Path Study
            </span>
            <div className="flex items-center gap-3 text-sm">
              <span className="hidden text-white/80 sm:inline">
                {session.user.name} さん
              </span>
              <form action={logout}>
                <button
                  type="submit"
                  className="rounded-full border border-white/30 px-3 py-1.5 text-xs font-medium transition hover:bg-white/10"
                >
                  ログアウト
                </button>
              </form>
            </div>
          </div>
          <NavBar />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
  );
}
