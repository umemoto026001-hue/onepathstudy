"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function changePassword(
  _prevState: string | undefined,
  formData: FormData,
) {
  const session = await auth();
  if (!session?.user) return "ログインが必要です。";

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (newPassword.length < 8) {
    return "新しいパスワードは8文字以上で入力してください。";
  }
  if (newPassword !== confirmPassword) {
    return "新しいパスワード（確認）が一致しません。";
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return "ユーザーが見つかりません。";

  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) return "現在のパスワードが正しくありません。";

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, mustChangePassword: false },
  });

  redirect("/dashboard");
}
