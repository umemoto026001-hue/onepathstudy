import { prisma } from "@/lib/prisma";
import { createStudent } from "@/app/actions/students";
import StudentForm from "@/components/StudentForm";
import { PageHeader } from "@/components/ui";

export default async function NewStudentPage() {
  const [subjects, universities] = await Promise.all([
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
    prisma.university.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader title="生徒を新規登録" />
      <StudentForm
        action={createStudent}
        subjects={subjects}
        universities={universities}
        submitLabel="登録する"
      />
    </div>
  );
}
