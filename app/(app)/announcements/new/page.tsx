import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import AnnouncementForm from "@/components/AnnouncementForm";
import { canSendAnnouncements, canViewAll } from "@/lib/permissions";
import { classAccessWhere } from "@/lib/classAccess";

export default async function NewAnnouncementPage() {
  const session = await auth();
  const role = session!.user.role as "TEACHER" | "STAFF" | "HQ" | "EXECUTIVE";
  if (!canSendAnnouncements(role)) {
    redirect("/dashboard");
  }

  const [campuses, classes] = await Promise.all([
    canViewAll(role) ? prisma.campus.findMany({ orderBy: { name: "asc" } }) : Promise.resolve([]),
    prisma.class.findMany({
      where: classAccessWhere(role, session!.user.id, session!.user.campusId),
      include: { subject: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="一斉連絡を送信"
        description="対象の保護者へメールで一斉送信します（メールアドレス未登録の場合は送信されません）"
      />
      <AnnouncementForm campuses={campuses} classes={classes} />
    </div>
  );
}
