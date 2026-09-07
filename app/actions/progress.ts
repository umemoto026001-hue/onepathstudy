"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

const progressSchema = z.object({
  studentId: z.string().min(1, "生徒を選択してください"),
  subjectId: z.string().min(1, "科目を選択してください"),
  teacherId: z.string().min(1, "担当講師を選択してください"),
  date: z.string().min(1, "日付を入力してください"),
  relatedScheduleId: z.string().optional(),
  coveredContent: z.string().min(1, "扱った内容を入力してください"),
  problemIds: z.array(z.string()),
  understandingLevel: z.enum(["GOOD", "NEEDS_REVIEW", "CONCERNING"]).optional(),
  homework: z.string().optional(),
  note: z.string().optional(),
});

export async function createProgressLog(
  _prevState: string | undefined,
  formData: FormData,
) {
  const result = progressSchema.safeParse({
    studentId: formData.get("studentId"),
    subjectId: formData.get("subjectId"),
    teacherId: formData.get("teacherId"),
    date: formData.get("date"),
    relatedScheduleId: formData.get("relatedScheduleId") || undefined,
    coveredContent: formData.get("coveredContent"),
    problemIds: formData.getAll("problemIds"),
    understandingLevel: formData.get("understandingLevel") || undefined,
    homework: formData.get("homework") || undefined,
    note: formData.get("note") || undefined,
  });

  if (!result.success) {
    return result.error.issues[0]?.message ?? "入力内容を確認してください。";
  }
  const data = result.data;

  await prisma.progressLog.create({
    data: {
      studentId: data.studentId,
      subjectId: data.subjectId,
      teacherId: data.teacherId,
      date: new Date(data.date),
      relatedScheduleId: data.relatedScheduleId || null,
      coveredContent: data.coveredContent,
      relatedProblems: { connect: data.problemIds.map((id) => ({ id })) },
      understandingLevel: data.understandingLevel,
      homework: data.homework || null,
      note: data.note || null,
    },
  });

  revalidatePath(`/students/${data.studentId}`);
  revalidatePath("/dashboard");
  redirect(`/students/${data.studentId}`);
}
