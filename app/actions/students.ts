"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

const studentSchema = z.object({
  studentNumber: z.string().min(1, "生徒番号を入力してください"),
  name: z.string().min(1, "氏名を入力してください"),
  targetSchool: z.string().optional(),
  subjectIds: z.array(z.string()),
  enrolledAt: z.string().optional(),
  parentContact: z.string().optional(),
  campusId: z.string().optional(),
  status: z.enum(["ENROLLED", "WITHDRAWN"]),
});

function parseForm(formData: FormData) {
  return studentSchema.safeParse({
    studentNumber: formData.get("studentNumber"),
    name: formData.get("name"),
    targetSchool: formData.get("targetSchool") || undefined,
    subjectIds: formData.getAll("subjectIds"),
    enrolledAt: formData.get("enrolledAt") || undefined,
    parentContact: formData.get("parentContact") || undefined,
    campusId: formData.get("campusId") || undefined,
    status: formData.get("status"),
  });
}

export async function createStudent(
  _prevState: string | undefined,
  formData: FormData,
) {
  const result = parseForm(formData);
  if (!result.success) {
    return result.error.issues[0]?.message ?? "入力内容を確認してください。";
  }
  const data = result.data;

  const existing = await prisma.student.findUnique({
    where: { studentNumber: data.studentNumber },
  });
  if (existing) return "この生徒番号は既に使用されています。";

  const student = await prisma.student.create({
    data: {
      studentNumber: data.studentNumber,
      name: data.name,
      targetSchool: data.targetSchool || null,
      subjects: { connect: data.subjectIds.map((id) => ({ id })) },
      enrolledAt: data.enrolledAt ? new Date(data.enrolledAt) : null,
      parentContact: data.parentContact || null,
      campusId: data.campusId || null,
      status: data.status,
    },
  });

  revalidatePath("/students");
  redirect(`/students/${student.id}`);
}

export async function updateStudent(
  id: string,
  _prevState: string | undefined,
  formData: FormData,
) {
  const result = parseForm(formData);
  if (!result.success) {
    return result.error.issues[0]?.message ?? "入力内容を確認してください。";
  }
  const data = result.data;

  const existing = await prisma.student.findFirst({
    where: { studentNumber: data.studentNumber, NOT: { id } },
  });
  if (existing) return "この生徒番号は既に使用されています。";

  await prisma.student.update({
    where: { id },
    data: {
      studentNumber: data.studentNumber,
      name: data.name,
      targetSchool: data.targetSchool || null,
      subjects: { set: data.subjectIds.map((sid) => ({ id: sid })) },
      enrolledAt: data.enrolledAt ? new Date(data.enrolledAt) : null,
      parentContact: data.parentContact || null,
      campusId: data.campusId || null,
      status: data.status,
    },
  });

  revalidatePath("/students");
  revalidatePath(`/students/${id}`);
  redirect(`/students/${id}`);
}
