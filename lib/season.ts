const zoned = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
export function tokyoDate(time: number) {
  return zoned.format(time);
}
export function validDate(date: unknown): date is string {
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date))
    return false;
  const stamp = Date.parse(date + "T00:00:00Z");
  return (
    Number.isFinite(stamp) &&
    new Date(stamp).toISOString().slice(0, 10) === date
  );
}
export function season(date: string) {
  const days = Math.max(
    0,
    Math.round(
      (Date.parse("2026-12-25T00:00:00Z") - Date.parse(date + "T00:00:00Z")) /
        86400000,
    ),
  );
  const today =
    date >= "2026-12-01" && date <= "2026-12-25" ? Number(date.slice(-2)) : 0;
  return { days, today, ended: date > "2026-12-25" };
}
export function nextMidnight(now: number) {
  return Date.parse(tokyoDate(now) + "T00:00:00+09:00") + 86400000;
}
