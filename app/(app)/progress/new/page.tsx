import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { toDateParam } from "@/lib/calendar";
import ProgressForm from "@/components/ProgressForm";
import { PageHeader } from "@/components/ui";

export default async function NewProgressPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string; scheduleId?: string }>;
}) {
  const { studentId, scheduleId } = await searchParams;
  const session = await auth();

  const [students, subjects, teachers, schedule] = await Promise.all([
    prisma.student.findMany({ orderBy: { name: "asc" } }),
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({ orderBy: { name: "asc" } }),
    scheduleId
      ? prisma.classSchedule.findUnique({ where: { id: scheduleId } })
      : Promise.resolve(null),
  ]);

  return (
    <div>
      <PageHeader title="進捗記録を登録" />
      <ProgressForm
        students={students}
        subjects={subjects}
        teachers={teachers}
        currentTeacherId={session!.user.id}
        defaultStudentId={schedule?.studentId ?? studentId}
        defaultSubjectId={schedule?.subjectId}
        defaultDate={toDateParam(schedule?.startAt ?? new Date())}
        relatedScheduleId={schedule?.id}
      />
    </div>
  );
}
