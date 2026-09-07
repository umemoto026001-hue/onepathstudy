import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge, Card, Field, Input, LinkButton, PageHeader, Select } from "@/components/ui";
import { DIFFICULTY_LABEL } from "@/lib/labels";
import type { Difficulty, Prisma } from "@prisma/client";

export default async function ProblemsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    subject?: string;
    university?: string;
    difficulty?: string;
  }>;
}) {
  const params = await searchParams;
  const [subjects, universities] = await Promise.all([
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
    prisma.university.findMany({ orderBy: { name: "asc" } }),
  ]);

  const where: Prisma.ProblemWhereInput = {};
  if (params.q) {
    where.OR = [
      { title: { contains: params.q } },
      { unit: { contains: params.q } },
      { university: { contains: params.q } },
      { problemText: { contains: params.q } },
    ];
  }
  if (params.subject) where.subjectId = params.subject;
  if (params.university) where.university = params.university;
  if (params.difficulty) where.difficulty = params.difficulty as Difficulty;

  const problems = await prisma.problem.findMany({
    where,
    include: { subject: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="演習データベース"
        description={`${problems.length}件`}
        actions={<LinkButton href="/problems/new">+ 演習問題を登録する</LinkButton>}
      />

      <Card className="mb-6">
        <form className="grid gap-3 sm:grid-cols-4" method="get">
          <Field label="キーワード検索" htmlFor="q">
            <Input id="q" name="q" placeholder="タイトル・単元・大学名・問題文" defaultValue={params.q ?? ""} />
          </Field>
          <Field label="科目" htmlFor="subject">
            <Select id="subject" name="subject" defaultValue={params.subject ?? ""}>
              <option value="">すべて</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="大学" htmlFor="university">
            <Select id="university" name="university" defaultValue={params.university ?? ""}>
              <option value="">すべて</option>
              {universities.map((u) => (
                <option key={u.id} value={u.name}>
                  {u.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="難易度" htmlFor="difficulty">
            <Select id="difficulty" name="difficulty" defaultValue={params.difficulty ?? ""}>
              <option value="">すべて</option>
              {Object.entries(DIFFICULTY_LABEL).map(([value, label]) => (
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
            {(params.q || params.subject || params.university || params.difficulty) && (
              <Link href="/problems" className="ml-3 text-sm text-navy/60 underline">
                条件をクリア
              </Link>
            )}
          </div>
        </form>
      </Card>

      <div className="space-y-3">
        {problems.map((problem) => (
          <details key={problem.id} className="group rounded-2xl border border-navy/10 bg-white shadow-sm open:shadow-md">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-heading font-bold text-navy">{problem.title}</span>
                  <Badge>{problem.subject.name}</Badge>
                  {problem.university && <Badge color="gold">{problem.university}</Badge>}
                  {problem.difficulty && <Badge color="coral">{DIFFICULTY_LABEL[problem.difficulty]}</Badge>}
                </div>
                <p className="mt-1 text-xs text-foreground/50">{problem.unit}</p>
              </div>
              <span className="shrink-0 text-navy/40 transition group-open:rotate-180">▼</span>
            </summary>
            <div className="space-y-4 border-t border-navy/10 px-5 py-4">
              <ProblemSection label="問題文" text={problem.problemText} />
              {problem.houshin && <ProblemSection label="方針" text={problem.houshin} />}
              {problem.kaitou && <ProblemSection label="解答" text={problem.kaitou} />}
              {problem.kaisetsu && <ProblemSection label="解説" text={problem.kaisetsu} />}
              <Link href={`/problems/${problem.id}`} className="inline-block text-sm text-coral underline">
                詳細ページ（編集・削除・利用履歴）を見る
              </Link>
            </div>
          </details>
        ))}
        {problems.length === 0 && (
          <Card className="py-8 text-center text-foreground/50">該当する演習問題がありません。</Card>
        )}
      </div>
    </div>
  );
}

function ProblemSection({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-navy/60">{label}</p>
      <p className="whitespace-pre-wrap text-sm">{text}</p>
    </div>
  );
}
