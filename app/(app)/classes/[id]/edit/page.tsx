import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateClass } from "@/app/actions/classes";
import ClassForm from "@/components/ClassForm";
import { PageHeader } from "@/components/ui";
import { canManageClasses } from "@/lib/permissions";

export default async function EditClassPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const role = session!.user.role as "TEACHER" | "STAFF" | "HQ" | "EXECUTIVE";
  if (!canManageClasses(role)) {
    redirect(`/classes/${id}`);
  }

  const [klass, subjects, teachers, campuses] = await Promise.all([
    prisma.class.findUnique({ where: { id } }),
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({ orderBy: { name: "asc" } }),
    prisma.campus.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!klass) notFound();

  return (
    <div>
      <PageHeader title={`${klass.name} を編集`} />
      <ClassForm
        action={updateClass.bind(null, id)}
        subjects={subjects}
        teachers={teachers}
        campuses={campuses}
        klass={klass}
        submitLabel="更新する"
      />
    </div>
  );
}
