"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  title: z.string().min(1, "タイトルを入力してください"),
  ownerId: z.string().min(1, "対象者を選択してください"),
  date: z.string().min(1, "日付を選択してください"),
  startTime: z.string().min(1, "開始時刻を入力してください"),
  endTime: z.string().min(1, "終了時刻を入力してください"),
  note: z.string().optional(),
});

export async function createSchedule(
  _prevState: string | undefined,
  formData: FormData,
) {
  const session = await auth();
  if (!session?.user) return "ログインが必要です。";

  const result = schema.safeParse({
    title: formData.get("title"),
    ownerId: formData.get("ownerId"),
    date: formData.get("date"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    note: formData.get("note") || undefined,
  });
  if (!result.success) {
    return result.error.issues[0]?.message ?? "入力内容を確認してください。";
  }
  const data = result.data;
  if (data.startTime >= data.endTime) {
    return "終了時刻は開始時刻より後にしてください。";
  }

  await prisma.schedule.create({
    data: {
      title: data.title,
      note: data.note || null,
      ownerId: data.ownerId,
      creatorId: session.user.id,
      date: new Date(`${data.date}T00:00:00`),
      startTime: data.startTime,
      endTime: data.endTime,
    },
  });

  revalidatePath("/dashboard");
  redirect(`/dashboard?date=${data.date}`);
}

export async function deleteSchedule(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("ログインが必要です。");

  const schedule = await prisma.schedule.findUnique({ where: { id } });
  if (!schedule) return;
  if (schedule.creatorId !== session.user.id && schedule.ownerId !== session.user.id) {
    throw new Error("このスケジュールを削除できるのは登録者本人のみです。");
  }

  await prisma.schedule.delete({ where: { id } });
  revalidatePath("/dashboard");
}
