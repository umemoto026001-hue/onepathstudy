"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendNotificationEmail } from "@/lib/email";
import { getAppUrl } from "@/lib/appUrl";

const taskSchema = z.object({
  title: z.string().min(1, "タイトルを入力してください"),
  description: z.string().optional(),
  assigneeId: z.string().min(1, "担当者を選択してください"),
  dueDate: z.string().optional(),
  scheduledDate: z.string().optional(),
  slotStart: z.string().optional(),
  slotEnd: z.string().optional(),
});

function parseTaskFormData(formData: FormData) {
  return taskSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    assigneeId: formData.get("assigneeId"),
    dueDate: formData.get("dueDate") || undefined,
    scheduledDate: formData.get("scheduledDate") || undefined,
    slotStart: formData.get("slotStart") || undefined,
    slotEnd: formData.get("slotEnd") || undefined,
  });
}

export async function createTask(
  _prevState: string | undefined,
  formData: FormData,
) {
  const session = await auth();
  if (!session?.user) return "ログインが必要です。";

  const result = parseTaskFormData(formData);
  if (!result.success) {
    return result.error.issues[0]?.message ?? "入力内容を確認してください。";
  }
  const data = result.data;
  if ((data.slotStart && !data.slotEnd) || (!data.slotStart && data.slotEnd)) {
    return "時間枠は開始・終了の両方を入力してください。";
  }
  if (data.slotStart && data.slotEnd && data.slotStart >= data.slotEnd) {
    return "終了時刻は開始時刻より後にしてください。";
  }

  const task = await prisma.task.create({
    data: {
      title: data.title,
      description: data.description || null,
      assigneeId: data.assigneeId,
      creatorId: session.user.id,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : null,
      slotStart: data.slotStart || null,
      slotEnd: data.slotEnd || null,
    },
    include: { assignee: true, creator: true },
  });

  await sendNotificationEmail({
    to: task.assignee.email,
    subject: `【One Path Study】新しいタスク: ${task.title}`,
    text: `${task.creator.name}さんからタスクが割り当てられました。\n\nタイトル: ${task.title}\n${task.description ? `内容: ${task.description}\n` : ""}\n${await getAppUrl("/tasks")}`,
  });

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  redirect("/tasks");
}

export async function updateTask(
  id: string,
  _prevState: string | undefined,
  formData: FormData,
) {
  const session = await auth();
  if (!session?.user) return "ログインが必要です。";

  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) return "タスクが見つかりません。";
  if (existing.creatorId !== session.user.id) {
    return "このタスクを編集できるのは依頼人本人のみです。";
  }

  const result = parseTaskFormData(formData);
  if (!result.success) {
    return result.error.issues[0]?.message ?? "入力内容を確認してください。";
  }
  const data = result.data;
  if ((data.slotStart && !data.slotEnd) || (!data.slotStart && data.slotEnd)) {
    return "時間枠は開始・終了の両方を入力してください。";
  }
  if (data.slotStart && data.slotEnd && data.slotStart >= data.slotEnd) {
    return "終了時刻は開始時刻より後にしてください。";
  }

  await prisma.task.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description || null,
      assigneeId: data.assigneeId,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : null,
      slotStart: data.slotStart || null,
      slotEnd: data.slotEnd || null,
    },
  });

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  redirect("/tasks");
}

export async function updateTaskStatus(id: string, status: string) {
  const validStatuses = ["TODO", "IN_PROGRESS", "DONE"];
  if (!validStatuses.includes(status)) return;

  await prisma.task.update({
    where: { id },
    data: { status: status as "TODO" | "IN_PROGRESS" | "DONE" },
  });

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function markTasksRead(taskIds: string[]) {
  if (taskIds.length === 0) return;
  await prisma.task.updateMany({
    where: { id: { in: taskIds }, isRead: false },
    data: { isRead: true },
  });
}
