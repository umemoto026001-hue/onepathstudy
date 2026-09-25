"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { fetchCalendarEventsForDay } from "@/lib/googleCalendar";

const urlSchema = z
  .string()
  .trim()
  .url("URLの形式が正しくありません")
  .optional()
  .or(z.literal(""));

export async function updateGoogleCalendarUrl(
  _prevState: string | undefined,
  formData: FormData,
) {
  const session = await auth();
  if (!session?.user) return "ログインが必要です。";

  const result = urlSchema.safeParse(formData.get("googleCalendarIcsUrl") ?? "");
  if (!result.success) {
    return result.error.issues[0]?.message ?? "入力内容を確認してください。";
  }
  const url = result.data || null;

  if (url) {
    try {
      await fetchCalendarEventsForDay(url, new Date());
    } catch {
      return "このURLからカレンダーを取得できませんでした。URLを確認してください。";
    }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { googleCalendarIcsUrl: url },
  });

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return undefined;
}
