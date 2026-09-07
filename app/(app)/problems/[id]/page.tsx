import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Badge, Card, LinkButton, PageHeader } from "@/components/ui";
import { DIFFICULTY_LABEL } from "@/lib/labels";
import { formatDate } from "@/lib/date";
import ProblemForm from "@/components/ProblemForm";
import { updateProblem } from "@/app/actions/problems";
import DeleteProblemButton from "@/components/DeleteProblemButton";

export default async function ProblemDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { id } = await params;
  const { edit } = await searchParams;

  const problem = await prisma.problem.findUnique({
    where: { id },
    include: {
      subject: true,
      createdBy: true,
      relatedInProgressLogs: {
        include: { student: true, subject: true },
        orderBy: { date: "desc" },
      },
    },
  });
  if (!problem) notFound();

  if (edit) {
    const [subjects, universities] = await Promise.all([
      prisma.subject.findMany({ orderBy: { name: "asc" } }),
      prisma.university.findMany({ orderBy: { name: "asc" } }),
    ]);
    return (
      <div>
        <PageHeader title="演習問題を編集" />
        <ProblemForm
          action={updateProblem.bind(null, id)}
          subjects={subjects}
          universities={universities}
          problem={problem}
          submitLabel="更新する"
          onCancelHref={`/problems/${id}`}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={problem.title}
        description={`登録: ${problem.createdBy.name} ・ ${formatDate(problem.createdAt)}`}
        actions={
          <>
            <LinkButton href={`/problems/${id}?edit=1`} variant="ghost">
              編集する
            </LinkButton>
            <DeleteProblemButton id={id} />
          </>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Badge>{problem.subject.name}</Badge>
        {problem.university && <Badge color="gold">{problem.university}</Badge>}
        {problem.difficulty && <Badge color="coral">{DIFFICULTY_LABEL[problem.difficulty]}</Badge>}
        <Badge color="gray">{problem.unit}</Badge>
      </div>

      <Card>
        <Section label="問題文" text={problem.problemText} />
      </Card>
      {problem.houshin && (
        <Card>
          <Section label="方針" text={problem.houshin} />
        </Card>
      )}
      {problem.kaitou && (
        <Card>
          <Section label="解答" text={problem.kaitou} />
        </Card>
      )}
      {problem.kaisetsu && (
        <Card>
          <Section label="解説" text={problem.kaisetsu} />
        </Card>
      )}

      <Card>
        <h2 className="mb-3 font-heading text-lg font-bold text-navy">この問題を使った進捗記録</h2>
        {problem.relatedInProgressLogs.length === 0 ? (
          <p className="text-sm text-foreground/50">まだこの問題を使った進捗記録はありません。</p>
        ) : (
          <ul className="space-y-2">
            {problem.relatedInProgressLogs.map((log) => (
              <li key={log.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-navy/5 px-3 py-2 text-sm">
                <span className="text-foreground/60">{formatDate(log.date)}</span>
                <Link href={`/students/${log.studentId}`} className="font-medium text-navy underline">
                  {log.student.name}
                </Link>
                <Badge>{log.subject.name}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Section({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-navy/60">{label}</p>
      <p className="whitespace-pre-wrap text-sm leading-relaxed">{text}</p>
    </div>
  );
}
