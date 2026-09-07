import { prisma } from "@/lib/prisma";

const PREFIX = "S";
const PAD = 4;

/** 生徒番号の自動採番（例: S0001）。手動編集された既存の番号とも衝突しないよう、
 * 現在登録されている番号のうち PREFIX+数字 の形式で最大のものの次番を採用する。 */
export async function generateStudentNumber() {
  const students = await prisma.student.findMany({
    where: { studentNumber: { startsWith: PREFIX } },
    select: { studentNumber: true },
  });

  let max = 0;
  for (const { studentNumber } of students) {
    const match = studentNumber.match(new RegExp(`^${PREFIX}(\\d+)$`));
    if (match) {
      max = Math.max(max, parseInt(match[1], 10));
    }
  }

  return `${PREFIX}${String(max + 1).padStart(PAD, "0")}`;
}
