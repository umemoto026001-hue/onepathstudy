"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

const classSchema = z.object({
  name: z.string().min(1, "クラス名を入力してください"),
  subjectId: z.string().min(1, "科目を選択してください"),
  level: z.string().min(1, "レベルを入力してください"),
  teacherId: z.string().min(1, "担当講師を選択してください"),
  weekday: z.enum(["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]),
  startTime: z.string().min(1, "開始時刻を入力してください"),
  endTime: z.string().min(1, "終了時刻を入力してください"),
  mode: z.enum(["ONLINE", "OFFLINE"]),
  campusId: z.string().optional(),
});

function parseForm(formData: FormData) {
  return classSchema.safeParse({
    name: formData.get("name"),
    subjectId: formData.get("subjectId"),
    level: formData.get("level"),
    teacherId: formData.get("teacherId"),
    weekday: formData.get("weekday"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    mode: formData.get("mode"),
    campusId: formData.get("campusId") || undefined,
  });
}

export async function createClass(
  _prevState: string | undefined,
  formData: FormData,
) {
  const result = parseForm(formData);
  if (!result.success) {
    return result.error.issues[0]?.message ?? "入力内容を確認してください。";
  }
  const data = result.data;
  if (data.endTime <= data.startTime) {
    return "終了時刻は開始時刻より後にしてください。";
  }

  const created = await prisma.class.create({
    data: {
      name: data.name,
      subjectId: data.subjectId,
      level: data.level,
      teacherId: data.teacherId,
      weekday: data.weekday,
      startTime: data.startTime,
      endTime: data.endTime,
      mode: data.mode,
      campusId: data.campusId || null,
    },
  });

  revalidatePath("/classes");
  redirect(`/classes/${created.id}`);
}

export async function updateClass(
  id: string,
  _prevState: string | undefined,
  formData: FormData,
) {
  const result = parseForm(formData);
  if (!result.success) {
    return result.error.issues[0]?.message ?? "入力内容を確認してください。";
  }
  const data = result.data;
  if (data.endTime <= data.startTime) {
    return "終了時刻は開始時刻より後にしてください。";
  }

  await prisma.class.update({
    where: { id },
    data: {
      name: data.name,
      subjectId: data.subjectId,
      level: data.level,
      teacherId: data.teacherId,
      weekday: data.weekday,
      startTime: data.startTime,
      endTime: data.endTime,
      mode: data.mode,
      campusId: data.campusId || null,
    },
  });

  revalidatePath("/classes");
  revalidatePath(`/classes/${id}`);
  redirect(`/classes/${id}`);
}

export async function updateEnrollment(classId: string, formData: FormData) {
  const studentIds = formData.getAll("studentIds").map(String);

  await prisma.$transaction([
    prisma.classEnrollment.deleteMany({ where: { classId } }),
    prisma.classEnrollment.createMany({
      data: studentIds.map((studentId) => ({ classId, studentId })),
    }),
  ]);

  revalidatePath(`/classes/${classId}`);
  redirect(`/classes/${classId}`);
}
