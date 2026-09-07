import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import ScheduleForm from "@/components/ScheduleForm";
import { PageHeader } from "@/components/ui";

export default async function NewSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string }>;
}) {
  const { studentId } = await searchParams;
  const session = await auth();
  const [students, subjects, teachers] = await Promise.all([
    prisma.student.findMany({ orderBy: { name: "asc" } }),
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader title="授業予定を新規登録" />
      <ScheduleForm
        students={students}
        subjects={subjects}
        teachers={teachers}
        currentTeacherId={session!.user.id}
        defaultStudentId={studentId}
      />
    </div>
  );
}
