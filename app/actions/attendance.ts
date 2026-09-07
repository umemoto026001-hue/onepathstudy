"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateClassSession } from "@/lib/classSession";

const VALID_STATUSES = ["PRESENT", "ABSENT", "LATE", "EXCUSED"];

export async function saveAttendance(
  classId: string,
  date: string,
  studentIds: string[],
  formData: FormData,
) {
  const session = await auth();
  if (!session?.user) return;

  const classSession = await getOrCreateClassSession(classId, new Date(`${date}T00:00:00`));

  await prisma.$transaction(
    studentIds.map((studentId) => {
      const status = String(formData.get(`status__${studentId}`) ?? "PRESENT");
      const note = String(formData.get(`note__${studentId}`) ?? "").trim();
      const safeStatus = VALID_STATUSES.includes(status) ? status : "PRESENT";

      return prisma.attendance.upsert({
        where: { classSessionId_studentId: { classSessionId: classSession.id, studentId } },
        update: {
          status: safeStatus as "PRESENT" | "ABSENT" | "LATE" | "EXCUSED",
          note: note || null,
          recordedById: session.user.id,
        },
        create: {
          classSessionId: classSession.id,
          studentId,
          status: safeStatus as "PRESENT" | "ABSENT" | "LATE" | "EXCUSED",
          note: note || null,
          recordedById: session.user.id,
        },
      });
    }),
  );

  revalidatePath("/attendance");
  redirect(`/attendance?classId=${classId}&date=${date}&saved=1`);
}
