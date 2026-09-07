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
});

export async function createTask(
  _prevState: string | undefined,
  formData: FormData,
) {
  const session = await auth();
  if (!session?.user) return "ログインが必要です。";

  const result = taskSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    assigneeId: formData.get("assigneeId"),
    dueDate: formData.get("dueDate") || undefined,
  });
  if (!result.success) {
    return result.error.issues[0]?.message ?? "入力内容を確認してください。";
  }
  const data = result.data;

  const task = await prisma.task.create({
    data: {
      title: data.title,
      description: data.description || null,
      assigneeId: data.assigneeId,
      creatorId: session.user.id,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
    },
    include: { assignee: true, creator: true },
  });

  await sendNotificationEmail({
    to: task.assignee.email,
    subject: `【One Path Study】新しいタスク: ${task.title}`,
    text: `${task.creator.name}さんからタスクが割り当てられました。\n\nタイトル: ${task.title}\n${task.description ? `内容: ${task.description}\n` : ""}\n${await getAppUrl("/tasks")}`,
  });

  revalidatePath("/tasks");
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
}

export async function markTasksRead(taskIds: string[]) {
  if (taskIds.length === 0) return;
  await prisma.task.updateMany({
    where: { id: { in: taskIds }, isRead: false },
    data: { isRead: true },
  });
}
