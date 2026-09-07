import { prisma } from "@/lib/prisma";
import { createProblem } from "@/app/actions/problems";
import ProblemForm from "@/components/ProblemForm";
import { PageHeader } from "@/components/ui";

export default async function NewProblemPage() {
  const [subjects, universities] = await Promise.all([
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
    prisma.university.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader title="演習問題を新規登録" />
      <ProblemForm
        action={createProblem}
        subjects={subjects}
        universities={universities}
        submitLabel="登録する"
        onCancelHref="/problems"
      />
    </div>
  );
}
