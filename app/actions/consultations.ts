"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canManageConsultationStatus } from "@/lib/permissions";
import { sendNotificationEmail } from "@/lib/email";
import { getAppUrl } from "@/lib/appUrl";

const consultationSchema = z.object({
  title: z.string().min(1, "件名を入力してください"),
  content: z.string().min(1, "相談内容を入力してください"),
  assigneeId: z.string().min(1, "担当者を選択してください"),
  studentId: z.string().optional(),
});

export async function createConsultation(
  _prevState: string | undefined,
  formData: FormData,
) {
  const session = await auth();
  if (!session?.user) return "ログインが必要です。";

  const result = consultationSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
    assigneeId: formData.get("assigneeId"),
    studentId: formData.get("studentId") || undefined,
  });
  if (!result.success) {
    return result.error.issues[0]?.message ?? "入力内容を確認してください。";
  }
  const data = result.data;

  const consultation = await prisma.consultation.create({
    data: {
      title: data.title,
      content: data.content,
      posterId: session.user.id,
      assigneeId: data.assigneeId,
      studentId: data.studentId || null,
    },
    include: { assignee: true, poster: true },
  });

  await sendNotificationEmail({
    to: consultation.assignee.email,
    subject: `【One Path Study】新しい相談・クレーム: ${consultation.title}`,
    text: `${consultation.poster.name}さんから相談・クレームが投稿されました。\n\n件名: ${consultation.title}\n内容: ${consultation.content}\n\n${await getAppUrl("/tasks?tab=consultations")}`,
  });

  revalidatePath("/tasks");
  redirect("/tasks?tab=consultations");
}

export async function updateConsultationStatus(id: string, status: string) {
  const session = await auth();
  if (!session?.user) return;

  const validStatuses = ["UNHANDLED", "IN_PROGRESS", "RESOLVED"];
  if (!validStatuses.includes(status)) return;

  const consultation = await prisma.consultation.findUnique({ where: { id } });
  if (!consultation) return;

  const isAssignee = consultation.assigneeId === session.user.id;
  if (!canManageConsultationStatus(session.user.role as "TEACHER" | "STAFF" | "HQ" | "EXECUTIVE", isAssignee)) {
    return;
  }

  await prisma.consultation.update({
    where: { id },
    data: { status: status as "UNHANDLED" | "IN_PROGRESS" | "RESOLVED" },
  });

  revalidatePath("/tasks");
}

export async function markConsultationsRead(ids: string[]) {
  if (ids.length === 0) return;
  await prisma.consultation.updateMany({
    where: { id: { in: ids }, isRead: false },
    data: { isRead: true },
  });
}
