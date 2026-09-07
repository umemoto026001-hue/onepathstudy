import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateStudent } from "@/app/actions/students";
import StudentForm from "@/components/StudentForm";
import { PageHeader } from "@/components/ui";
import { canViewAll, canViewStudentRoster } from "@/lib/permissions";

export default async function EditStudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const role = session!.user.role as "TEACHER" | "STAFF" | "HQ" | "EXECUTIVE";
  if (!canViewStudentRoster(role)) {
    redirect("/dashboard");
  }

  const [student, subjects, campuses] = await Promise.all([
    prisma.student.findUnique({ where: { id }, include: { subjects: true } }),
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
    canViewAll(role)
      ? prisma.campus.findMany({ orderBy: { name: "asc" } })
      : prisma.campus.findMany({ where: { id: session!.user.campusId ?? "" } }),
  ]);

  if (!student) notFound();
  if (!canViewAll(role) && student.campusId !== session!.user.campusId) {
    redirect("/students");
  }

  return (
    <div>
      <PageHeader title={`${student.name} さんの情報を編集`} />
      <StudentForm
        action={updateStudent.bind(null, id)}
        subjects={subjects}
        campuses={campuses}
        student={student}
        submitLabel="更新する"
      />
    </div>
  );
}
