import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import InterviewForm from "@/components/InterviewForm";
import { PageHeader } from "@/components/ui";
import { canViewAll, canViewStudentRoster } from "@/lib/permissions";

export default async function NewInterviewPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string }>;
}) {
  const { studentId } = await searchParams;
  const session = await auth();
  const role = session!.user.role as "TEACHER" | "STAFF" | "HQ" | "EXECUTIVE";
  if (!canViewStudentRoster(role)) {
    redirect("/dashboard");
  }

  const students = await prisma.student.findMany({
    where: canViewAll(role) ? {} : { campusId: session!.user.campusId },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader title="面談記録を追加" />
      <InterviewForm students={students} defaultStudentId={studentId} />
    </div>
  );
}
