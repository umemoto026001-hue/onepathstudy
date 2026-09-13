"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canManageShifts } from "@/lib/permissions";
import { WEEKDAY_ORDER } from "@/lib/labels";
import type { Role } from "@prisma/client";

export async function updateUserShifts(
  userId: string,
  _prevState: string | undefined,
  formData: FormData,
) {
  const session = await auth();
  if (!session?.user || !canManageShifts(session.user.role as Role)) {
    return "権限がありません。";
  }

  const entries = WEEKDAY_ORDER.map((weekday) => ({
    weekday,
    startTime: String(formData.get(`start_${weekday}`) ?? "").trim(),
    endTime: String(formData.get(`end_${weekday}`) ?? "").trim(),
  }));

  for (const { weekday, startTime, endTime } of entries) {
    if (startTime && endTime && startTime >= endTime) {
      return `${weekday}: 終了時刻は開始時刻より後にしてください。`;
    }
  }

  await prisma.$transaction(
    entries.map(({ weekday, startTime, endTime }) =>
      startTime && endTime
        ? prisma.workShift.upsert({
            where: { userId_weekday: { userId, weekday } },
            create: { userId, weekday, startTime, endTime },
            update: { startTime, endTime },
          })
        : prisma.workShift.deleteMany({ where: { userId, weekday } }),
    ),
  );

  revalidatePath(`/settings/shifts/${userId}`);
  revalidatePath("/dashboard");
  return undefined;
}
