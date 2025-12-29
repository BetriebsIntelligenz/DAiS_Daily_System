export const HOUSEHOLD_WEEKDAYS = [
  { value: 1, label: "Montag" },
  { value: 2, label: "Dienstag" },
  { value: 3, label: "Mittwoch" },
  { value: 4, label: "Donnerstag" },
  { value: 5, label: "Freitag" },
  { value: 6, label: "Samstag" },
  { value: 7, label: "Sonntag" }
] as const;

export function formatWeekday(value: number) {
  return HOUSEHOLD_WEEKDAYS.find((entry) => entry.value === value)?.label ?? "Tag";
}

export function formatWeekdays(values: number[]) {
  if (!values || values.length === 0) return "";
  const sorted = [...values].sort((a, b) => a - b);
  return sorted.map(v => formatWeekday(v).slice(0, 2)).join(", ");
}

export function getWeekStart(date: Date) {
  const clone = new Date(date);
  clone.setHours(0, 0, 0, 0);
  const weekday = clone.getDay();
  const diff = weekday === 0 ? 6 : weekday - 1;
  clone.setDate(clone.getDate() - diff);
  return clone;
}

export function getWeekEnd(start: Date) {
  const clone = new Date(start);
  clone.setDate(clone.getDate() + 6);
  clone.setHours(23, 59, 59, 999);
  return clone;
}

export function getWeekDays(start: Date) {
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

export function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}
