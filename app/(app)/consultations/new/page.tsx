import { prisma } from "@/lib/prisma";
import ConsultationForm from "@/components/ConsultationForm";
import { PageHeader } from "@/components/ui";

export default async function NewConsultationPage() {
  const [users, students] = await Promise.all([
    prisma.user.findMany({ orderBy: { name: "asc" } }),
    prisma.student.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader title="相談・クレームを投稿" />
      <ConsultationForm users={users} students={students} />
    </div>
  );
}
