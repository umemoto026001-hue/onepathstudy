import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import ScheduleForm from "@/components/ScheduleForm";
import { PageHeader } from "@/components/ui";

export default async function NewSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ ownerId?: string; date?: string; start?: string; end?: string }>;
}) {
  const session = await auth();
  const [users, { ownerId, date, start, end }] = await Promise.all([
    prisma.user.findMany({ orderBy: { name: "asc" } }),
    searchParams,
  ]);

  return (
    <div>
      <PageHeader
        title="スケジュールを登録"
        description="タスクとは別に、時間をブロックする予定（会議・出張など）を登録します。ステータス管理はありません。"
      />
      <ScheduleForm
        users={users}
        defaults={{ ownerId: ownerId ?? session!.user.id, date, start, end }}
      />
    </div>
  );
}
