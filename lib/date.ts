import { format } from "date-fns";
import { ja } from "date-fns/locale";

export function formatDate(date: Date | string) {
  return format(new Date(date), "yyyy/MM/dd (E)", { locale: ja });
}

export function formatDateTime(date: Date | string) {
  return format(new Date(date), "yyyy/MM/dd (E) HH:mm", { locale: ja });
}

export function formatTime(date: Date | string) {
  return format(new Date(date), "HH:mm", { locale: ja });
}

export function formatDayShort(date: Date | string) {
  return format(new Date(date), "M/d(E)", { locale: ja });
}

export function formatMonthLabel(date: Date | string) {
  return format(new Date(date), "yyyy年M月", { locale: ja });
}
