import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Badge, Card, LinkButton, PageHeader } from "@/components/ui";
import MasterListSection from "@/components/MasterListSection";
import UserForm from "@/components/UserForm";
import DeleteUserButton from "@/components/DeleteUserButton";
import {
  createSubject,
  createUniversity,
  createUser,
  deleteSubject,
  deleteUniversity,
  updateSubject,
  updateUniversity,
  updateUser,
} from "@/app/actions/settings";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ newUser?: string; editUserId?: string }>;
}) {
  const { newUser, editUserId } = await searchParams;
  const session = await auth();

  const [subjects, universities, users] = await Promise.all([
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
    prisma.university.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({ include: { subjects: true }, orderBy: { createdAt: "asc" } }),
  ]);

  const editingUser = editUserId ? users.find((u) => u.id === editUserId) : undefined;

  return (
    <div className="space-y-6">
      <PageHeader title="基本設定" />

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
        <h2 className="mb-3 font-heading text-lg font-bold text-navy">対象大学マスタ</h2>
        <MasterListSection
          items={universities}
          createAction={createUniversity}
          updateAction={updateUniversity}
          deleteAction={deleteUniversity}
          placeholder="新しい大学名"
          deleteConfirmLabel="削除"
          emptyLabel="対象大学が登録されていません。"
        />
      </Card>

      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-heading text-lg font-bold text-navy">利用者（講師アカウント）</h2>
          {!newUser && !editingUser && (
            <LinkButton href="/settings?newUser=1">+ 講師を追加する</LinkButton>
          )}
        </div>

        {editingUser ? (
          <div className="space-y-3">
            <p className="text-sm text-navy/60">「{editingUser.name}」さんの情報を編集</p>
            <UserForm
              action={updateUser.bind(null, editingUser.id)}
              subjects={subjects}
              user={editingUser}
              submitLabel="更新する"
              onCancelHref="/settings"
            />
          </div>
        ) : newUser ? (
          <div className="space-y-3">
            <p className="text-sm text-navy/60">新しい講師アカウントを追加</p>
            <UserForm
              action={createUser}
              subjects={subjects}
              submitLabel="追加する"
              onCancelHref="/settings"
            />
          </div>
        ) : (
          <ul className="divide-y divide-navy/10 rounded-lg border border-navy/10">
            {users.map((user) => (
              <li key={user.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-navy">{user.name}</span>
                    <Badge>{user.role === "ADMIN" ? "管理者" : "講師"}</Badge>
                  </div>
                  <p className="text-sm text-foreground/60">{user.email}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {user.subjects.map((s) => (
                      <Badge key={s.id} color="gold">
                        {s.name}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Link href={`/settings?editUserId=${user.id}`} className="text-sm text-navy underline">
                    編集
                  </Link>
                  {session?.user.id !== user.id && (
                    <DeleteUserButton id={user.id} name={user.name} />
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
