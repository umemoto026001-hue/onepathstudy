import type { Role } from "@prisma/client";

// 3-7. 役職別アクセス範囲 に基づく権限ヘルパー。
// - TEACHER: 自分のクラスの出欠・演習提出、自分宛タスク・自分の相談投稿のみ
// - STAFF（校舎スタッフ）: 所属校舎の生徒名簿・出欠・自分宛タスク・自分の相談投稿
// - HQ（本部社員）: 全校舎の集計・全タスク・相談一覧の閲覧
// - EXECUTIVE（役員）: 全機能・タスクの割り振り・相談の対応状況管理・他社員の役割権限設定

export const ROLE_LABEL: Record<Role, string> = {
  TEACHER: "講師",
  STAFF: "校舎スタッフ",
  HQ: "本部社員",
  EXECUTIVE: "役員",
};

/** 全校舎・全生徒・全タスク・全相談など、組織全体を横断して閲覧できるか */
export function canViewAll(role: Role) {
  return role === "HQ" || role === "EXECUTIVE";
}

/** 生徒名簿・クラス・出欠・演習提出を「自分の所属校舎」範囲で閲覧できるか */
export function isCampusScoped(role: Role) {
  return role === "STAFF";
}

/** 自分が担当するクラスの範囲でしか出欠・演習提出を扱えないか */
export function isClassScoped(role: Role) {
  return role === "TEACHER";
}

/** 生徒名簿ページへのアクセス可否（提案書3-7では講師には付与されていない） */
export function canViewStudentRoster(role: Role) {
  return role !== "TEACHER";
}

/** クラスの新規作成・編集ができるか（講師は自分のクラスの中身は見るが編成はしない想定） */
export function canManageClasses(role: Role) {
  return role === "STAFF" || role === "HQ" || role === "EXECUTIVE";
}

/** 社員・役職・校舎・科目マスタ管理ページへのアクセス可否 */
export function canManageSettings(role: Role) {
  return role === "EXECUTIVE";
}

/** 相談のステータスを誰でも更新できるわけではなく、担当者本人 or 役員のみ */
export function canManageConsultationStatus(role: Role, isAssignee: boolean) {
  return isAssignee || role === "EXECUTIVE";
}

/** 社員の出勤シフト（曜日固定）を編集できるか */
export function canManageShifts(role: Role) {
  return role === "EXECUTIVE";
}

/** タスクの編集ができるか（依頼人本人のみ） */
export function canEditTask(isCreator: boolean) {
  return isCreator;
}
