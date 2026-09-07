import type { ConsultationStatus, TaskStatus } from "@prisma/client";

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
