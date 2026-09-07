import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateStudent } from "@/app/actions/students";
import StudentForm from "@/components/StudentForm";
import { PageHeader } from "@/components/ui";

export default async function EditStudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [student, subjects, universities] = await Promise.all([
    prisma.student.findUnique({ where: { id }, include: { subjects: true } }),
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
    prisma.university.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!student) notFound();

  return (
    <div>
      <PageHeader title={`${student.name} さんの情報を編集`} />
      <StudentForm
        action={updateStudent.bind(null, id)}
        subjects={subjects}
        universities={universities}
        student={student}
        submitLabel="更新する"
      />
    </div>
  );
}
