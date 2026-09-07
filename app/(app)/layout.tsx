import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { logout } from "@/app/actions/auth";
import NavBar, { type NavItem } from "@/components/NavBar";
import { canManageSettings, canViewStudentRoster, ROLE_LABEL } from "@/lib/permissions";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/");
  }
  if (session.user.mustChangePassword) {
    redirect("/change-password");
  }

  const role = session.user.role as "TEACHER" | "STAFF" | "HQ" | "EXECUTIVE";

  const navItems: NavItem[] = [
    { href: "/dashboard", label: "ダッシュボード" },
    { href: "/tasks", label: "タスク・相談" },
    ...(canViewStudentRoster(role) ? [{ href: "/students", label: "生徒名簿" }] : []),
    { href: "/classes", label: "クラス" },
    { href: "/attendance", label: "出欠" },
    { href: "/submissions", label: "演習提出" },
    ...(canViewStudentRoster(role) ? [{ href: "/interviews", label: "面談記録" }] : []),
    ...(canManageSettings(role) ? [{ href: "/settings", label: "設定" }] : []),
  ];

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
                {session.user.name}（{ROLE_LABEL[role]}）
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
          <NavBar items={navItems} />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
  );
}
