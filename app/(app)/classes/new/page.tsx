import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createClass } from "@/app/actions/classes";
import ClassForm from "@/components/ClassForm";
import { PageHeader } from "@/components/ui";
import { canManageClasses } from "@/lib/permissions";

export default async function NewClassPage() {
  const session = await auth();
  const role = session!.user.role as "TEACHER" | "STAFF" | "HQ" | "EXECUTIVE";
  if (!canManageClasses(role)) {
    redirect("/classes");
  }

  const [subjects, teachers, campuses] = await Promise.all([
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({ orderBy: { name: "asc" } }),
    prisma.campus.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader title="クラスを新規登録" />
      <ClassForm action={createClass} subjects={subjects} teachers={teachers} campuses={campuses} submitLabel="登録する" />
    </div>
  );
}
