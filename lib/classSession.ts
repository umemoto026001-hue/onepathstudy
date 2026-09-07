import { prisma } from "@/lib/prisma";

/** 指定クラス・指定日の実施回（ClassSession）を取得、なければ作成する。 */
export async function getOrCreateClassSession(classId: string, date: Date) {
  const truncated = new Date(date);
  truncated.setHours(0, 0, 0, 0);

  const existing = await prisma.classSession.findUnique({
    where: { classId_date: { classId, date: truncated } },
  });
  if (existing) return existing;

  return prisma.classSession.create({ data: { classId, date: truncated } });
}
