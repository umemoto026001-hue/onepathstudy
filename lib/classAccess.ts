import type { Prisma, Role } from "@prisma/client";
import { canViewAll, isClassScoped } from "@/lib/permissions";

/** 3-7 の役職別アクセス範囲に基づき、閲覧可能なクラスを絞り込む where 条件を返す。 */
export function classAccessWhere(
  role: Role,
  userId: string,
  campusId: string | null,
): Prisma.ClassWhereInput {
  if (isClassScoped(role)) {
    return { teacherId: userId };
  }
  if (!canViewAll(role)) {
    return { OR: [{ campusId }, { campusId: null }] };
  }
  return {};
}
