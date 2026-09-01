const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const pad = (value: number) => String(value).padStart(2, "0");

/** Formats an API timestamp in the device's local timezone. */
export function formatAuditDateTime(value: string | number | Date): string {
  const dateOnly = typeof value === "string"
    ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
    : null;
  const date = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : value instanceof Date
      ? value
      : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  const hour = date.getHours();
  const displayHour = hour % 12 || 12;
  const period = hour < 12 ? "AM" : "PM";

  return `${pad(date.getDate())} ${MONTHS[date.getMonth()]} ${date.getFullYear()}, ${pad(displayHour)}:${pad(date.getMinutes())} ${period}`;
}
