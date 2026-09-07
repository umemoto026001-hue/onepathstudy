import type {
  Difficulty,
  Grade,
  ScheduleStatus,
  StudentStatus,
  UnderstandingLevel,
} from "@prisma/client";

export const GRADE_LABEL: Record<Grade, string> = {
  G1: "高1",
  G2: "高2",
  G3: "高3",
  GRADUATE: "既卒",
};

export const STUDENT_STATUS_LABEL: Record<StudentStatus, string> = {
  CONSIDERING: "検討中",
  TRIAL: "体験中",
  ENROLLED: "在籍中",
  ON_LEAVE: "休会",
  WITHDRAWN: "退会",
};

export const STUDENT_STATUS_BADGE: Record<StudentStatus, "navy" | "coral" | "gold" | "gray" | "green"> = {
  CONSIDERING: "gray",
  TRIAL: "gold",
  ENROLLED: "green",
  ON_LEAVE: "coral",
  WITHDRAWN: "gray",
};

export const SCHEDULE_STATUS_LABEL: Record<ScheduleStatus, string> = {
  SCHEDULED: "予定",
  COMPLETED: "実施済み",
  ABSENT: "欠席",
  RESCHEDULED: "振替",
};

export const SCHEDULE_STATUS_BADGE: Record<ScheduleStatus, "navy" | "coral" | "gold" | "gray" | "green"> = {
  SCHEDULED: "navy",
  COMPLETED: "green",
  ABSENT: "coral",
  RESCHEDULED: "gold",
};

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  BASIC: "基礎",
  STANDARD: "標準",
  FAIRLY_HARD: "やや難",
  HARD: "難",
};

export const UNDERSTANDING_LABEL: Record<UnderstandingLevel, string> = {
  GOOD: "順調",
  NEEDS_REVIEW: "要復習",
  CONCERNING: "要注意",
};

export const UNDERSTANDING_BADGE: Record<UnderstandingLevel, "navy" | "coral" | "gold" | "gray" | "green"> = {
  GOOD: "green",
  NEEDS_REVIEW: "gold",
  CONCERNING: "coral",
};
