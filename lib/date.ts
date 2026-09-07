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
