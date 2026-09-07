import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge, Card, Field, Input, LinkButton, PageHeader, Select } from "@/components/ui";
import { GRADE_LABEL, STUDENT_STATUS_BADGE, STUDENT_STATUS_LABEL } from "@/lib/labels";
import type { Grade, Prisma, StudentStatus } from "@prisma/client";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    grade?: string;
    subject?: string;
    status?: string;
  }>;
}) {
  const params = await searchParams;
  const subjects = await prisma.subject.findMany({ orderBy: { name: "asc" } });

  const where: Prisma.StudentWhereInput = {};
  if (params.q) {
    where.OR = [
      { name: { contains: params.q } },
      { targetUniversity: { contains: params.q } },
    ];
  }
  if (params.grade) {
    where.grade = params.grade as Grade;
  }
  if (params.status) {
    where.status = params.status as StudentStatus;
  }
  if (params.subject) {
    where.subjects = { some: { id: params.subject } };
  }

  const students = await prisma.student.findMany({
    where,
    include: { subjects: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="生徒管理"
        description={`${students.length}件`}
        actions={<LinkButton href="/students/new">+ 生徒を登録する</LinkButton>}
      />

      <Card className="mb-6">
        <form className="grid gap-3 sm:grid-cols-4" method="get">
          <Field label="キーワード検索" htmlFor="q">
            <Input id="q" name="q" placeholder="氏名・志望大学" defaultValue={params.q ?? ""} />
          </Field>
          <Field label="学年" htmlFor="grade">
            <Select id="grade" name="grade" defaultValue={params.grade ?? ""}>
              <option value="">すべて</option>
              {Object.entries(GRADE_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="受講科目" htmlFor="subject">
            <Select id="subject" name="subject" defaultValue={params.subject ?? ""}>
              <option value="">すべて</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="在籍ステータス" htmlFor="status">
            <Select id="status" name="status" defaultValue={params.status ?? ""}>
              <option value="">すべて</option>
              {Object.entries(STUDENT_STATUS_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <div className="sm:col-span-4">
            <button
              type="submit"
              className="rounded-lg bg-navy px-4 py-2.5 text-sm font-bold text-white hover:opacity-90"
            >
              絞り込む
            </button>
            {(params.q || params.grade || params.subject || params.status) && (
              <Link href="/students" className="ml-3 text-sm text-navy/60 underline">
                条件をクリア
              </Link>
            )}
          </div>
        </form>
      </Card>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-navy/5 text-xs uppercase text-navy/60">
            <tr>
              <th className="px-4 py-3">氏名</th>
              <th className="px-4 py-3">学年</th>
              <th className="px-4 py-3">志望大学</th>
              <th className="px-4 py-3">受講科目</th>
              <th className="px-4 py-3">ステータス</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id} className="border-t border-navy/10 hover:bg-navy/5">
                <td className="px-4 py-3">
                  <Link href={`/students/${student.id}`} className="font-medium text-navy underline-offset-2 hover:underline">
                    {student.name}
                  </Link>
                </td>
                <td className="px-4 py-3">{GRADE_LABEL[student.grade]}</td>
                <td className="px-4 py-3">{student.targetUniversity ?? "-"}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {student.subjects.map((s) => (
                      <Badge key={s.id}>{s.name}</Badge>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge color={STUDENT_STATUS_BADGE[student.status]}>
                    {STUDENT_STATUS_LABEL[student.status]}
                  </Badge>
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-foreground/50">
                  該当する生徒がいません。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
