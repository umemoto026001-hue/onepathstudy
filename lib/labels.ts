import type {
  AttendanceStatus,
  ClassMode,
  ConsultationStatus,
  StudentStatus,
  TaskStatus,
  Weekday,
} from "@prisma/client";

export const WEEKDAY_LABEL: Record<Weekday, string> = {
  MON: "月",
  TUE: "火",
  WED: "水",
  THU: "木",
  FRI: "金",
  SAT: "土",
  SUN: "日",
};

export const WEEKDAY_ORDER: Weekday[] = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export const CLASS_MODE_LABEL: Record<ClassMode, string> = {
  ONLINE: "オンライン",
  OFFLINE: "対面",
};

export const ATTENDANCE_STATUS_LABEL: Record<AttendanceStatus, string> = {
  PRESENT: "出席",
  ABSENT: "欠席",
  LATE: "遅刻",
  EXCUSED: "公欠",
};

export const ATTENDANCE_STATUS_BADGE: Record<AttendanceStatus, "navy" | "coral" | "gold" | "gray" | "green"> = {
  PRESENT: "green",
  ABSENT: "coral",
  LATE: "gold",
  EXCUSED: "gray",
};

export const STUDENT_STATUS_LABEL: Record<StudentStatus, string> = {
  ENROLLED: "在籍中",
  WITHDRAWN: "退会",
};

export const STUDENT_STATUS_BADGE: Record<StudentStatus, "navy" | "coral" | "gold" | "gray" | "green"> = {
  ENROLLED: "green",
  WITHDRAWN: "gray",
};

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  TODO: "未対応",
  IN_PROGRESS: "対応中",
  DONE: "完了",
};

export const TASK_STATUS_BADGE: Record<TaskStatus, "navy" | "coral" | "gold" | "gray" | "green"> = {
  TODO: "coral",
  IN_PROGRESS: "gold",
  DONE: "green",
};

export const CONSULTATION_STATUS_LABEL: Record<ConsultationStatus, string> = {
  UNHANDLED: "未対応",
  IN_PROGRESS: "対応中",
  RESOLVED: "対応済み",
};

export const CONSULTATION_STATUS_BADGE: Record<ConsultationStatus, "navy" | "coral" | "gold" | "gray" | "green"> = {
  UNHANDLED: "coral",
  IN_PROGRESS: "gold",
  RESOLVED: "green",
};
