import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createStudent } from "@/app/actions/students";
import StudentForm from "@/components/StudentForm";
import { PageHeader } from "@/components/ui";
import { canViewAll, canViewStudentRoster } from "@/lib/permissions";
import { generateStudentNumber } from "@/lib/studentNumber";

export default async function NewStudentPage() {
  const session = await auth();
  const role = session!.user.role as "TEACHER" | "STAFF" | "HQ" | "EXECUTIVE";
  if (!canViewStudentRoster(role)) {
    redirect("/dashboard");
  }

  const [subjects, campuses, defaultStudentNumber] = await Promise.all([
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
    canViewAll(role)
      ? prisma.campus.findMany({ orderBy: { name: "asc" } })
      : prisma.campus.findMany({ where: { id: session!.user.campusId ?? "" } }),
    generateStudentNumber(),
  ]);

  return (
    <div>
      <PageHeader title="生徒を新規登録" />
      <StudentForm
        action={createStudent}
        subjects={subjects}
        campuses={campuses}
        defaultStudentNumber={defaultStudentNumber}
        submitLabel="登録する"
      />
    </div>
  );
}
