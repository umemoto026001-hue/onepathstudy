"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

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
  await prisma.subject.delete({ where: { id } });
  revalidatePath("/settings");
}

// --- University master ---

export async function createUniversity(
  _prevState: string | undefined,
  formData: FormData,
) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return "大学名を入力してください。";

  await prisma.university.create({ data: { name } });
  revalidatePath("/settings");
}

export async function updateUniversity(id: string, name: string) {
  if (!name.trim()) return;
  await prisma.university.update({ where: { id }, data: { name: name.trim() } });
  revalidatePath("/settings");
}

export async function deleteUniversity(id: string) {
  await prisma.university.delete({ where: { id } });
  revalidatePath("/settings");
}

// --- User (teacher) accounts ---

const userSchema = z.object({
  name: z.string().min(1, "氏名を入力してください"),
  email: z.string().email("有効なメールアドレスを入力してください"),
  role: z.enum(["ADMIN", "TEACHER"]),
  subjectIds: z.array(z.string()),
  password: z.string().optional(),
});

export async function createUser(
  _prevState: string | undefined,
  formData: FormData,
) {
  const result = userSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    subjectIds: formData.getAll("subjectIds"),
    password: formData.get("password") || undefined,
  });
  if (!result.success) {
    return result.error.issues[0]?.message ?? "入力内容を確認してください。";
  }
  const data = result.data;
  if (!data.password || data.password.length < 6) {
    return "初期パスワードは6文字以上で入力してください。";
  }

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) return "このメールアドレスは既に使用されています。";

  const passwordHash = await bcrypt.hash(data.password, 10);
  await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      role: data.role,
      passwordHash,
      subjects: { connect: data.subjectIds.map((id) => ({ id })) },
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
    email: formData.get("email"),
    role: formData.get("role"),
    subjectIds: formData.getAll("subjectIds"),
    password: formData.get("password") || undefined,
  });
  if (!result.success) {
    return result.error.issues[0]?.message ?? "入力内容を確認してください。";
  }
  const data = result.data;

  const existing = await prisma.user.findFirst({
    where: { email: data.email, NOT: { id } },
  });
  if (existing) return "このメールアドレスは既に使用されています。";

  if (data.password && data.password.length > 0 && data.password.length < 6) {
    return "パスワードは6文字以上で入力してください。";
  }

  await prisma.user.update({
    where: { id },
    data: {
      name: data.name,
      email: data.email,
      role: data.role,
      subjects: { set: data.subjectIds.map((sid) => ({ id: sid })) },
      ...(data.password ? { passwordHash: await bcrypt.hash(data.password, 10) } : {}),
    },
  });

  revalidatePath("/settings");
  redirect("/settings");
}

export async function deleteUser(id: string) {
  await prisma.user.delete({ where: { id } });
  revalidatePath("/settings");
}
