"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const interviewSchema = z.object({
  studentId: z.string().min(1, "生徒を選択してください"),
  date: z.string().min(1, "面談日を入力してください"),
  content: z.string().min(1, "面談内容を入力してください"),
});

export async function createInterview(
  _prevState: string | undefined,
  formData: FormData,
) {
  const session = await auth();
  if (!session?.user) return "ログインが必要です。";

  const result = interviewSchema.safeParse({
    studentId: formData.get("studentId"),
    date: formData.get("date"),
    content: formData.get("content"),
  });
  if (!result.success) {
    return result.error.issues[0]?.message ?? "入力内容を確認してください。";
  }
  const data = result.data;

  await prisma.interview.create({
    data: {
      studentId: data.studentId,
      date: new Date(data.date),
      content: data.content,
      recordedById: session.user.id,
    },
  });

  revalidatePath("/interviews");
  revalidatePath(`/students/${data.studentId}`);
  redirect(`/students/${data.studentId}`);
}
