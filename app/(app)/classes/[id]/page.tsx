import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Badge, Card, LinkButton, PageHeader } from "@/components/ui";
import { CLASS_MODE_LABEL, WEEKDAY_LABEL } from "@/lib/labels";
import { canManageClasses, canViewAll, isClassScoped } from "@/lib/permissions";
import EnrollmentForm from "@/components/EnrollmentForm";

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const role = session!.user.role as "TEACHER" | "STAFF" | "HQ" | "EXECUTIVE";

  const klass = await prisma.class.findUnique({
    where: { id },
    include: {
      subject: true,
      teacher: true,
      campus: true,
      enrollments: { include: { student: true }, orderBy: { student: { name: "asc" } } },
    },
  });
  if (!klass) notFound();

  if (isClassScoped(role) && klass.teacherId !== session!.user.id) {
    redirect("/classes");
  }
  if (!canViewAll(role) && !isClassScoped(role) && klass.campusId && klass.campusId !== session!.user.campusId) {
    redirect("/classes");
  }

  const students = canManageClasses(role)
    ? await prisma.student.findMany({ where: { status: "ENROLLED" }, orderBy: { name: "asc" } })
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={klass.name}
        description={`${WEEKDAY_LABEL[klass.weekday]}曜日 ${klass.startTime}〜${klass.endTime}`}
        actions={
          <>
            <LinkButton href={`/attendance?classId=${klass.id}`}>出欠をつける</LinkButton>
            <LinkButton href={`/submissions?classId=${klass.id}`} variant="secondary">
              演習提出をつける
            </LinkButton>
            {canManageClasses(role) && (
              <LinkButton href={`/classes/${klass.id}/edit`} variant="ghost">
                編集する
              </LinkButton>
            )}
          </>
        }
      />

      <Card>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Info label="科目"><Badge>{klass.subject.name}</Badge></Info>
          <Info label="レベル">{klass.level}</Info>
          <Info label="担当講師">{klass.teacher.name}</Info>
          <Info label="形式">
            <Badge color={klass.mode === "ONLINE" ? "navy" : "green"}>{CLASS_MODE_LABEL[klass.mode]}</Badge>
          </Info>
          <Info label="校舎">{klass.campus?.name ?? "-"}</Info>
          <Info label="所属生徒数">{klass.enrollments.length}名</Info>
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 font-heading text-lg font-bold text-navy">所属生徒</h2>
        {canManageClasses(role) ? (
          <EnrollmentForm
            classId={klass.id}
            students={students}
            enrolledStudentIds={klass.enrollments.map((e) => e.studentId)}
          />
        ) : (
          <ul className="flex flex-wrap gap-2">
            {klass.enrollments.map((e) => (
              <Badge key={e.id}>{e.student.name}</Badge>
            ))}
            {klass.enrollments.length === 0 && (
              <p className="text-sm text-foreground/50">所属生徒はまだいません。</p>
            )}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-navy/60">{label}</p>
      <div className="mt-0.5 text-sm">{children}</div>
    </div>
  );
}
