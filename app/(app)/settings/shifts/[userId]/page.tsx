import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import ShiftForm from "@/components/ShiftForm";
import { canManageShifts } from "@/lib/permissions";
import { updateUserShifts } from "@/app/actions/shifts";

export default async function UserShiftsPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const session = await auth();
  const role = session!.user.role as "TEACHER" | "STAFF" | "HQ" | "EXECUTIVE";
  if (!canManageShifts(role)) {
    redirect("/settings");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { shifts: true },
  });
  if (!user) notFound();

  return (
    <div>
      <PageHeader
        title={`${user.name}さんの出勤シフト`}
        description="曜日固定の出勤予定です。ダッシュボードの本日のタイムテーブルに反映されます。"
      />
      <ShiftForm
        action={updateUserShifts.bind(null, user.id)}
        shifts={user.shifts}
        onCancelHref="/settings"
      />
    </div>
  );
}
