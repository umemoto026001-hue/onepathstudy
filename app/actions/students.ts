"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

const studentSchema = z.object({
  name: z.string().min(1, "氏名を入力してください"),
  grade: z.enum(["G1", "G2", "G3", "GRADUATE"]),
  targetUniversity: z.string().optional(),
  targetFaculty: z.string().optional(),
  subjectIds: z.array(z.string()),
  parentName: z.string().optional(),
  parentContact: z.string().optional(),
  studentContact: z.string().optional(),
  enrolledAt: z.string().optional(),
  status: z.enum(["CONSIDERING", "TRIAL", "ENROLLED", "ON_LEAVE", "WITHDRAWN"]),
  memo: z.string().optional(),
});

function parseForm(formData: FormData) {
  const raw = {
    name: formData.get("name"),
    grade: formData.get("grade"),
    targetUniversity: formData.get("targetUniversity") || undefined,
    targetFaculty: formData.get("targetFaculty") || undefined,
    subjectIds: formData.getAll("subjectIds"),
    parentName: formData.get("parentName") || undefined,
    parentContact: formData.get("parentContact") || undefined,
    studentContact: formData.get("studentContact") || undefined,
    enrolledAt: formData.get("enrolledAt") || undefined,
    status: formData.get("status"),
    memo: formData.get("memo") || undefined,
  };
  return studentSchema.safeParse(raw);
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

  const student = await prisma.student.create({
    data: {
      name: data.name,
      grade: data.grade,
      targetUniversity: data.targetUniversity || null,
      targetFaculty: data.targetFaculty || null,
      subjects: { connect: data.subjectIds.map((id) => ({ id })) },
      parentName: data.parentName || null,
      parentContact: data.parentContact || null,
      studentContact: data.studentContact || null,
      enrolledAt: data.enrolledAt ? new Date(data.enrolledAt) : null,
      status: data.status,
      memo: data.memo || null,
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

  await prisma.student.update({
    where: { id },
    data: {
      name: data.name,
      grade: data.grade,
      targetUniversity: data.targetUniversity || null,
      targetFaculty: data.targetFaculty || null,
      subjects: { set: data.subjectIds.map((sid) => ({ id: sid })) },
      parentName: data.parentName || null,
      parentContact: data.parentContact || null,
      studentContact: data.studentContact || null,
      enrolledAt: data.enrolledAt ? new Date(data.enrolledAt) : null,
      status: data.status,
      memo: data.memo || null,
    },
  });

  revalidatePath("/students");
  revalidatePath(`/students/${id}`);
  redirect(`/students/${id}`);
}
