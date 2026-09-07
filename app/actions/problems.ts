"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const problemSchema = z.object({
  title: z.string().min(1, "タイトルを入力してください"),
  subjectId: z.string().min(1, "科目を選択してください"),
  university: z.string().optional(),
  unit: z.string().min(1, "単元・キーワードを入力してください"),
  problemText: z.string().min(1, "問題文を入力してください"),
  houshin: z.string().optional(),
  kaitou: z.string().optional(),
  kaisetsu: z.string().optional(),
  difficulty: z.enum(["BASIC", "STANDARD", "FAIRLY_HARD", "HARD"]).optional(),
});

function parseForm(formData: FormData) {
  return problemSchema.safeParse({
    title: formData.get("title"),
    subjectId: formData.get("subjectId"),
    university: formData.get("university") || undefined,
    unit: formData.get("unit"),
    problemText: formData.get("problemText"),
    houshin: formData.get("houshin") || undefined,
    kaitou: formData.get("kaitou") || undefined,
    kaisetsu: formData.get("kaisetsu") || undefined,
    difficulty: formData.get("difficulty") || undefined,
  });
}

export async function createProblem(
  _prevState: string | undefined,
  formData: FormData,
) {
  const result = parseForm(formData);
  if (!result.success) {
    return result.error.issues[0]?.message ?? "入力内容を確認してください。";
  }
  const session = await auth();
  if (!session?.user) return "ログインが必要です。";
  const data = result.data;

  const problem = await prisma.problem.create({
    data: {
      title: data.title,
      subjectId: data.subjectId,
      createdById: session.user.id,
      university: data.university || null,
      unit: data.unit,
      problemText: data.problemText,
      houshin: data.houshin || null,
      kaitou: data.kaitou || null,
      kaisetsu: data.kaisetsu || null,
      difficulty: data.difficulty,
    },
  });

  revalidatePath("/problems");
  redirect(`/problems/${problem.id}`);
}

export async function updateProblem(
  id: string,
  _prevState: string | undefined,
  formData: FormData,
) {
  const result = parseForm(formData);
  if (!result.success) {
    return result.error.issues[0]?.message ?? "入力内容を確認してください。";
  }
  const data = result.data;

  await prisma.problem.update({
    where: { id },
    data: {
      title: data.title,
      subjectId: data.subjectId,
      university: data.university || null,
      unit: data.unit,
      problemText: data.problemText,
      houshin: data.houshin || null,
      kaitou: data.kaitou || null,
      kaisetsu: data.kaisetsu || null,
      difficulty: data.difficulty,
    },
  });

  revalidatePath("/problems");
  revalidatePath(`/problems/${id}`);
  redirect(`/problems/${id}`);
}

export async function deleteProblem(id: string) {
  await prisma.problem.delete({ where: { id } });
  revalidatePath("/problems");
  redirect("/problems");
}
