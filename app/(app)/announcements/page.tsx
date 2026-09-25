import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, LinkButton, PageHeader } from "@/components/ui";
import { canSendAnnouncements, canViewAll } from "@/lib/permissions";
import { formatDateTime } from "@/lib/date";

export default async function AnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; count?: string; skipped?: string }>;
}) {
  const session = await auth();
  const role = session!.user.role as "TEACHER" | "STAFF" | "HQ" | "EXECUTIVE";
  if (!canSendAnnouncements(role)) {
    redirect("/dashboard");
  }
  const { sent, count, skipped } = await searchParams;

  const announcements = await prisma.announcement.findMany({
    where: canViewAll(role)
      ? {}
      : {
          OR: [
            { campusId: session!.user.campusId },
            { class: { campusId: session!.user.campusId } },
          ],
        },
    include: { sender: true, campus: true, class: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div>
      <PageHeader
        title="一斉連絡"
        description="保護者へのメール一斉送信・送信履歴"
        actions={<LinkButton href="/announcements/new">+ 新規送信</LinkButton>}
      />

      {sent && (
        <p className="mb-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          送信しました（{count}件に送信{Number(skipped) > 0 && `・${skipped}件はメール未登録のため送信されず`}）。
        </p>
      )}

      <div className="space-y-3">
        {announcements.map((a) => (
          <Card key={a.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-heading font-bold text-navy">{a.title}</span>
              <span className="text-xs text-foreground/50">{formatDateTime(a.createdAt)}</span>
            </div>
            <p className="mt-1 text-xs text-foreground/50">
              送信者: {a.sender.name} ・ 宛先:{" "}
              {a.class ? `${a.class.name}の在籍生徒` : a.campus ? `${a.campus.name}の生徒` : "全校舎の生徒"} ・{" "}
              {a.recipientCount}件送信
              {a.skippedCount > 0 && `（${a.skippedCount}件はメール未登録のため送信されず）`}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm">{a.content}</p>
          </Card>
        ))}
        {announcements.length === 0 && (
          <Card className="py-8 text-center text-foreground/50">送信履歴はまだありません。</Card>
        )}
      </div>
    </div>
  );
}
