import Link from "next/link";
import { addDays, subDays } from "date-fns";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Badge, Card, Field, Input, PageHeader, Select } from "@/components/ui";
import { WEEKDAY_LABEL } from "@/lib/labels";
import { classAccessWhere } from "@/lib/classAccess";
import { formatDayShort, toDateParam } from "@/lib/date";
import SubmissionForm from "@/components/SubmissionForm";
import { saveSubmissions } from "@/app/actions/submissions";

export default async function SubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string; date?: string; saved?: string }>;
}) {
  const { classId, date, saved } = await searchParams;
  const session = await auth();
  const role = session!.user.role as "TEACHER" | "STAFF" | "HQ" | "EXECUTIVE";

  const classes = await prisma.class.findMany({
    where: classAccessWhere(role, session!.user.id, session!.user.campusId),
    include: { subject: true, teacher: true },
    orderBy: [{ weekday: "asc" }, { startTime: "asc" }],
  });

  const selectedDate = date ? new Date(`${date}T00:00:00`) : new Date();
  const dateParam = toDateParam(selectedDate);
  const selectedClass = classId ? classes.find((c) => c.id === classId) : undefined;

  return (
    <div className="space-y-6">
      <PageHeader title="演習・要約提出トラッキング" description="クラスと日付を選んで提出状況を記録します" />

      <Card>
        <form className="grid gap-3 sm:grid-cols-3" method="get">
          <Field label="クラス" htmlFor="classId" required>
            <Select id="classId" name="classId" required defaultValue={classId ?? ""}>
              <option value="" disabled>
                選択してください
              </option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {WEEKDAY_LABEL[c.weekday]}曜 {c.startTime} {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="日付" htmlFor="date" required>
            <Input id="date" name="date" type="date" required defaultValue={dateParam} />
          </Field>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full rounded-lg bg-navy px-4 py-2.5 text-sm font-bold text-white hover:opacity-90"
            >
              表示する
            </button>
          </div>
        </form>
      </Card>

      {saved && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">保存しました。</p>
      )}

      {selectedClass && (
        <Card>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-heading text-lg font-bold text-navy">{selectedClass.name}</h2>
              <p className="text-sm text-foreground/60">
                <Badge>{selectedClass.subject.name}</Badge> ・ 担当: {selectedClass.teacher.name} ・{" "}
                {formatDayShort(selectedDate)}
              </p>
            </div>
            <div className="flex gap-2 text-sm">
              <Link
                href={`/submissions?classId=${classId}&date=${toDateParam(subDays(selectedDate, 7))}`}
                className="rounded-lg border border-navy/20 px-3 py-1.5 hover:bg-navy/5"
              >
                ← 前週
              </Link>
              <Link
                href={`/submissions?classId=${classId}&date=${toDateParam(addDays(selectedDate, 7))}`}
                className="rounded-lg border border-navy/20 px-3 py-1.5 hover:bg-navy/5"
              >
                次週 →
              </Link>
            </div>
          </div>
          <SubmissionBody classId={selectedClass.id} date={dateParam} />
        </Card>
      )}
    </div>
  );
}

async function SubmissionBody({ classId, date }: { classId: string; date: string }) {
  const [enrollments, existingSession] = await Promise.all([
    prisma.classEnrollment.findMany({
      where: { classId },
      include: { student: true },
      orderBy: { student: { name: "asc" } },
    }),
    prisma.classSession.findFirst({
      where: { classId, date: new Date(`${date}T00:00:00`) },
      include: { submissions: true },
    }),
  ]);

  const students = enrollments.map((e) => e.student);
  const existing = new Map(
    (existingSession?.submissions ?? []).map((s) => [s.studentId, { submitted: s.submitted, note: s.note }]),
  );
  const studentIds = students.map((s) => s.id);

  const action = saveSubmissions.bind(null, classId, date, studentIds);

  return <SubmissionForm action={action} students={students} existing={existing} />;
}
