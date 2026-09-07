"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

function isForeignKeyError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003"
  );
}

// --- Subject master ---

export async function createSubject(
  _prevState: string | undefined,
  formData: FormData,
) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return "科目名を入力してください。";

  await prisma.subject.create({ data: { name } });
  revalidatePath("/settings");
}

export async function updateSubject(id: string, name: string) {
  if (!name.trim()) return;
  await prisma.subject.update({ where: { id }, data: { name: name.trim() } });
  revalidatePath("/settings");
}

export async function deleteSubject(id: string) {
  try {
    await prisma.subject.delete({ where: { id } });
  } catch (error) {
    if (isForeignKeyError(error)) {
      throw new Error("この科目は生徒またはクラスで使用されているため削除できません。");
    }
    throw error;
  }
  revalidatePath("/settings");
}

// --- Campus master ---

export async function createCampus(
  _prevState: string | undefined,
  formData: FormData,
) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return "校舎名を入力してください。";

  await prisma.campus.create({ data: { name } });
  revalidatePath("/settings");
}

export async function updateCampus(id: string, name: string) {
  if (!name.trim()) return;
  await prisma.campus.update({ where: { id }, data: { name: name.trim() } });
  revalidatePath("/settings");
}

export async function deleteCampus(id: string) {
  try {
    await prisma.campus.delete({ where: { id } });
  } catch (error) {
    if (isForeignKeyError(error)) {
      throw new Error("この校舎は社員または生徒・クラスに割り当てられているため削除できません。");
    }
    throw error;
  }
  revalidatePath("/settings");
}

// --- User (employee) accounts ---

const userSchema = z.object({
  name: z.string().min(1, "氏名を入力してください"),
  employeeNumber: z.string().min(1, "社員番号を入力してください"),
  role: z.enum(["TEACHER", "STAFF", "HQ", "EXECUTIVE"]),
  campusId: z.string().optional(),
});

export async function createUser(
  _prevState: string | undefined,
  formData: FormData,
) {
  const result = userSchema.safeParse({
    name: formData.get("name"),
    employeeNumber: formData.get("employeeNumber"),
    role: formData.get("role"),
    campusId: formData.get("campusId") || undefined,
  });
  if (!result.success) {
    return result.error.issues[0]?.message ?? "入力内容を確認してください。";
  }
  const data = result.data;

  const existing = await prisma.user.findUnique({ where: { employeeNumber: data.employeeNumber } });
  if (existing) return "この社員番号は既に使用されています。";

  const passwordHash = await bcrypt.hash("onepath", 10);
  await prisma.user.create({
    data: {
      name: data.name,
      employeeNumber: data.employeeNumber,
      role: data.role,
      campusId: data.campusId || null,
      passwordHash,
      mustChangePassword: true,
    },
  });

  revalidatePath("/settings");
  redirect("/settings");
}

export async function updateUser(
  id: string,
  _prevState: string | undefined,
  formData: FormData,
) {
  const result = userSchema.safeParse({
    name: formData.get("name"),
    employeeNumber: formData.get("employeeNumber"),
    role: formData.get("role"),
    campusId: formData.get("campusId") || undefined,
  });
  if (!result.success) {
    return result.error.issues[0]?.message ?? "入力内容を確認してください。";
  }
  const data = result.data;

  const existing = await prisma.user.findFirst({
    where: { employeeNumber: data.employeeNumber, NOT: { id } },
  });
  if (existing) return "この社員番号は既に使用されています。";

  await prisma.user.update({
    where: { id },
    data: {
      name: data.name,
      employeeNumber: data.employeeNumber,
      role: data.role,
      campusId: data.campusId || null,
    },
  });

  revalidatePath("/settings");
  redirect("/settings");
}

export async function resetPassword(id: string) {
  const passwordHash = await bcrypt.hash("onepath", 10);
  await prisma.user.update({
    where: { id },
    data: { passwordHash, mustChangePassword: true },
  });
  revalidatePath("/settings");
}

export async function deleteUser(id: string) {
  try {
    await prisma.user.delete({ where: { id } });
  } catch (error) {
    if (isForeignKeyError(error)) {
      throw new Error(
        "このアカウントはクラス・タスク・相談・出欠等の記録に紐づいているため削除できません。",
      );
    }
    throw error;
  }
  revalidatePath("/settings");
}
