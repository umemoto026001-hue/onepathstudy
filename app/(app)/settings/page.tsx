import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Badge, Card, LinkButton, PageHeader } from "@/components/ui";
import MasterListSection from "@/components/MasterListSection";
import UserForm from "@/components/UserForm";
import DeleteUserButton from "@/components/DeleteUserButton";
import ResetPasswordButton from "@/components/ResetPasswordButton";
import { canManageSettings, ROLE_LABEL } from "@/lib/permissions";
import {
  createCampus,
  createSubject,
  createUser,
  deleteCampus,
  deleteSubject,
  updateCampus,
  updateSubject,
  updateUser,
} from "@/app/actions/settings";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ newUser?: string; editUserId?: string }>;
}) {
  const session = await auth();
  const role = session!.user.role as "TEACHER" | "STAFF" | "HQ" | "EXECUTIVE";
  if (!canManageSettings(role)) {
    redirect("/dashboard");
  }

  const { newUser, editUserId } = await searchParams;

  const [subjects, campuses, users] = await Promise.all([
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
    prisma.campus.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({ include: { campus: true }, orderBy: { createdAt: "asc" } }),
  ]);

  const editingUser = editUserId ? users.find((u) => u.id === editUserId) : undefined;

  return (
    <div className="space-y-6">
      <PageHeader title="基本設定" description="役職の編集権限は役員（梅本・木村）のみです" />

      <Card>
        <h2 className="mb-3 font-heading text-lg font-bold text-navy">科目マスタ</h2>
        <MasterListSection
          items={subjects}
          createAction={createSubject}
          updateAction={updateSubject}
          deleteAction={deleteSubject}
          placeholder="新しい科目名"
          deleteConfirmLabel="削除"
          emptyLabel="科目が登録されていません。"
        />
      </Card>

      <Card>
        <h2 className="mb-3 font-heading text-lg font-bold text-navy">校舎マスタ</h2>
        <MasterListSection
          items={campuses}
          createAction={createCampus}
          updateAction={updateCampus}
          deleteAction={deleteCampus}
          placeholder="新しい校舎名"
          deleteConfirmLabel="削除"
          emptyLabel="校舎が登録されていません。"
        />
      </Card>

      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-heading text-lg font-bold text-navy">社員・役職管理</h2>
          {!newUser && !editingUser && (
            <LinkButton href="/settings?newUser=1">+ 社員を追加する</LinkButton>
          )}
        </div>

        {editingUser ? (
          <div className="space-y-3">
            <p className="text-sm text-navy/60">「{editingUser.name}」さんの情報を編集</p>
            <UserForm
              action={updateUser.bind(null, editingUser.id)}
              campuses={campuses}
              user={editingUser}
              submitLabel="更新する"
              onCancelHref="/settings"
            />
          </div>
        ) : newUser ? (
          <div className="space-y-3">
            <p className="text-sm text-navy/60">新しい社員アカウントを追加</p>
            <UserForm action={createUser} campuses={campuses} submitLabel="追加する" onCancelHref="/settings" />
          </div>
        ) : (
          <ul className="divide-y divide-navy/10 rounded-lg border border-navy/10">
            {users.map((user) => (
              <li key={user.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-navy">{user.name}</span>
                    <Badge>{ROLE_LABEL[user.role]}</Badge>
                    {user.mustChangePassword && <Badge color="gold">パスワード未変更</Badge>}
                  </div>
                  <p className="text-sm text-foreground/60">
                    社員番号: {user.employeeNumber} ・ {user.campus?.name ?? "校舎未設定"}
                    {user.email ? ` ・ ${user.email}` : " ・ 通知メール未設定"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Link href={`/settings?editUserId=${user.id}`} className="text-sm text-navy underline">
                    編集
                  </Link>
                  <Link href={`/settings/shifts/${user.id}`} className="text-sm text-navy underline">
                    シフト
                  </Link>
                  <ResetPasswordButton id={user.id} name={user.name} />
                  {session!.user.id !== user.id && <DeleteUserButton id={user.id} name={user.name} />}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
