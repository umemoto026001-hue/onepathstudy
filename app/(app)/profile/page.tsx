import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import GoogleCalendarForm from "@/components/GoogleCalendarForm";

export default async function ProfilePage() {
  const session = await auth();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session!.user.id } });

  return (
    <div className="space-y-6">
      <PageHeader title="個人設定" description={`${user.name}さんの個人設定`} />
      <GoogleCalendarForm currentUrl={user.googleCalendarIcsUrl} />
    </div>
  );
}
