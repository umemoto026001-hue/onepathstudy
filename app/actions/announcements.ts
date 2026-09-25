"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendNotificationEmail } from "@/lib/email";
import { canSendAnnouncements, canViewAll } from "@/lib/permissions";
import type { Role } from "@prisma/client";

// Student.parentContact は自由記述（電話番号の場合もある）のため、メール形式に
// 見える宛先にのみ送信する。妥当性チェックはしない（誤送信よりは送り漏れの方が安全）。
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const schema = z.object({
  title: z.string().min(1, "件名を入力してください"),
  content: z.string().min(1, "本文を入力してください"),
  campusId: z.string().optional(),
  classId: z.string().optional(),
});

export async function sendAnnouncement(
  _prevState: string | undefined,
  formData: FormData,
) {
  const session = await auth();
  const role = session?.user.role as Role | undefined;
  if (!session?.user || !role || !canSendAnnouncements(role)) {
    return "権限がありません。";
  }

  const result = schema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
    campusId: formData.get("campusId") || undefined,
    classId: formData.get("classId") || undefined,
  });
  if (!result.success) {
    return result.error.issues[0]?.message ?? "入力内容を確認してください。";
  }
  const data = result.data;
  const seeAll = canViewAll(role);

  // 校舎スタッフは自分の校舎の範囲でしか送れない（フォームの値によらず強制する）。
  if (!seeAll && !session.user.campusId) {
    return "所属校舎が設定されていないため送信できません。設定を確認してください。";
  }

  let students;
  let resolvedClassId: string | null = null;
  let resolvedCampusId: string | null = null;

  if (data.classId) {
    const klass = await prisma.class.findUnique({ where: { id: data.classId } });
    if (!klass) return "クラスが見つかりません。";
    if (!seeAll && klass.campusId !== session.user.campusId) {
      return "この校舎のクラスではありません。";
    }
    const enrollments = await prisma.classEnrollment.findMany({
      where: { classId: data.classId },
      include: { student: true },
    });
    students = enrollments.map((e) => e.student).filter((s) => s.status === "ENROLLED");
    resolvedClassId = data.classId;
  } else {
    resolvedCampusId = seeAll ? data.campusId || null : session.user.campusId!;
    students = await prisma.student.findMany({
      where: { status: "ENROLLED", ...(resolvedCampusId ? { campusId: resolvedCampusId } : {}) },
    });
  }

  const recipients = students.filter((s) => s.parentContact && EMAIL_RE.test(s.parentContact));
  const skippedCount = students.length - recipients.length;

  await Promise.all(
    recipients.map((s) =>
      sendNotificationEmail({ to: s.parentContact, subject: data.title, text: data.content }),
    ),
  );

  await prisma.announcement.create({
    data: {
      title: data.title,
      content: data.content,
      senderId: session.user.id,
      campusId: resolvedCampusId,
      classId: resolvedClassId,
      recipientCount: recipients.length,
      skippedCount,
    },
  });

  revalidatePath("/announcements");
  redirect(`/announcements?sent=1&count=${recipients.length}&skipped=${skippedCount}`);
}
