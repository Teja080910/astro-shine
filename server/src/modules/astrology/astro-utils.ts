export function parseDateStr(dateStr: string): {
  day: number;
  month: number;
  year: number;
} {
  const parts = (dateStr || '').trim().split('-').map(Number);
  if (parts.length === 3 && parts.every((p) => !isNaN(p) && p > 0)) {
    if (parts[0] > 31) {
      return { day: parts[2], month: parts[1], year: parts[0] }; // YYYY-MM-DD
    }
    if (parts[2] > 31) {
      return { day: parts[0], month: parts[1], year: parts[2] }; // DD-MM-YYYY
    }
    return { day: parts[0], month: parts[1], year: parts[2] }; // DD-MM-YY
  }
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return { day: d.getDate(), month: d.getMonth() + 1, year: d.getFullYear() };
  }
  return { day: 1, month: 1, year: 1990 };
}

export function parseTimeStr(s: string): string {
  const t = (s || '').trim();
  const m3 = t.match(/(\d+)\s*:\s*(\d+)\s*:\s*(\d+)/);
  if (m3) {
    const h = String(Number(m3[1])).padStart(2, '0');
    const min = String(Number(m3[2])).padStart(2, '0');
    const sec = String(Number(m3[3])).padStart(2, '0');
    return `${h}:${min}:${sec}`;
  }
  const m2 = t.match(/(\d+)\s*:\s*(\d+)/);
  if (m2) {
    const h = String(Number(m2[1])).padStart(2, '0');
    const min = String(Number(m2[2])).padStart(2, '0');
    return `${h}:${min}:00`;
  }
  return '';
}

export function formatTimeInZone(
  d: Date | null | undefined,
  timezone: number,
): string {
  if (!d || isNaN(d.getTime())) return '';
  const shifted = new Date(d.getTime() + (timezone || 5.5) * 3600_000);
  const h = String(shifted.getUTCHours()).padStart(2, '0');
  const m = String(shifted.getUTCMinutes()).padStart(2, '0');
  const s = String(shifted.getUTCSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export function toUtcDate(
  dateStr: string,
  timeStr: string,
  timezone: number,
): Date {
  const { day, month, year } = parseDateStr(dateStr);
  const parts = (timeStr || '').split(':').map(Number);
  const h = parts[0] || 6;
  const m = parts[1] || 0;
  const localMs = Date.UTC(year, month - 1, day, h, m, 0);
  return new Date(localMs - (timezone || 5.5) * 3600_000);
}

export function localNoonUtc(dateStr: string, timezone: number): Date {
  const { day, month, year } = parseDateStr(dateStr);
  return new Date(
    Date.UTC(year, month - 1, day, 12, 0, 0) - (timezone || 5.5) * 3600_000,
  );
}
