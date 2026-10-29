import { format } from "date-fns";

/**
 * Логічна дата з урахуванням того, що день починається о 03:00.
 * До 03:00 ранку ще вважається попередній день.
 */
export function getLogicalDate(date: Date = new Date()): string {
  const adjusted = new Date(date.getTime() - 3 * 60 * 60 * 1000);
  return format(adjusted, "yyyy-MM-dd");
}

export function getLogicalYesterday(): string {
  const todayLogical = getLogicalDate();
  const [year, month, day] = todayLogical.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() - 1);
  return format(d, "yyyy-MM-dd");
}
