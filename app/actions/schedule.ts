"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

const scheduleSchema = z.object({
  studentId: z.string().min(1, "生徒を選択してください"),
  subjectId: z.string().min(1, "科目を選択してください"),
  teacherId: z.string().min(1, "担当講師を選択してください"),
  date: z.string().min(1, "日付を入力してください"),
  startTime: z.string().min(1, "開始時刻を入力してください"),
  endTime: z.string().min(1, "終了時刻を入力してください"),
  isRecurring: z.string().optional(),
  recurrenceRule: z.string().optional(),
  meetingUrl: z.string().optional(),
  note: z.string().optional(),
});

export async function createSchedule(
  _prevState: string | undefined,
  formData: FormData,
) {
  const result = scheduleSchema.safeParse({
    studentId: formData.get("studentId"),
    subjectId: formData.get("subjectId"),
    teacherId: formData.get("teacherId"),
    date: formData.get("date"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    isRecurring: formData.get("isRecurring") || undefined,
    recurrenceRule: formData.get("recurrenceRule") || undefined,
    meetingUrl: formData.get("meetingUrl") || undefined,
    note: formData.get("note") || undefined,
  });

  if (!result.success) {
    return result.error.issues[0]?.message ?? "入力内容を確認してください。";
  }
  const data = result.data;
  const startAt = new Date(`${data.date}T${data.startTime}`);
  const endAt = new Date(`${data.date}T${data.endTime}`);

  if (endAt <= startAt) {
    return "終了時刻は開始時刻より後にしてください。";
  }

  const schedule = await prisma.classSchedule.create({
    data: {
      studentId: data.studentId,
      subjectId: data.subjectId,
      teacherId: data.teacherId,
      startAt,
      endAt,
      isRecurring: data.isRecurring === "on",
      recurrenceRule: data.recurrenceRule || null,
      meetingUrl: data.meetingUrl || null,
      note: data.note || null,
    },
  });

  revalidatePath("/schedule");
  revalidatePath(`/students/${data.studentId}`);
  redirect(`/schedule?scheduleId=${schedule.id}`);
}

export async function updateScheduleStatus(id: string, status: string) {
  const validStatuses = ["SCHEDULED", "COMPLETED", "ABSENT", "RESCHEDULED"];
  if (!validStatuses.includes(status)) return;

  const schedule = await prisma.classSchedule.update({
    where: { id },
    data: { status: status as "SCHEDULED" | "COMPLETED" | "ABSENT" | "RESCHEDULED" },
  });

  revalidatePath("/schedule");
  revalidatePath(`/students/${schedule.studentId}`);
}
