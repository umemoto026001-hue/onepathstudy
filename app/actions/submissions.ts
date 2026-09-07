"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateClassSession } from "@/lib/classSession";

export async function saveSubmissions(
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
      const submitted = formData.get(`submitted__${studentId}`) === "on";
      const note = String(formData.get(`note__${studentId}`) ?? "").trim();

      return prisma.submission.upsert({
        where: { classSessionId_studentId: { classSessionId: classSession.id, studentId } },
        update: { submitted, note: note || null, recordedById: session.user.id },
        create: {
          classSessionId: classSession.id,
          studentId,
          submitted,
          note: note || null,
          recordedById: session.user.id,
        },
      });
    }),
  );

  revalidatePath("/submissions");
  redirect(`/submissions?classId=${classId}&date=${date}&saved=1`);
}
