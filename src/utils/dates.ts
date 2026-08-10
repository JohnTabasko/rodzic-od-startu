export const DAY = 24 * 60 * 60 * 1000;

function parseDateParts(iso: string): [number, number, number] | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

export function todayISO(): string {
  const now = new Date();
  return [now.getFullYear(), now.getMonth() + 1, now.getDate()]
    .map((value, index) => (index === 0 ? String(value) : String(value).padStart(2, '0')))
    .join('-');
}

export function isValidISODate(value: string): boolean {
  const parts = parseDateParts(value);
  if (!parts) return false;
  const [year, month, day] = parts;
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

function dateFromISO(iso: string): Date {
  const parts = parseDateParts(iso);
  if (!parts) return new Date(Number.NaN);
  const [year, month, day] = parts;
  return new Date(year, month - 1, day);
}

export function formatPL(iso: string): string {
  return dateFromISO(iso).toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function addDays(iso: string, days: number): string {
  const parts = parseDateParts(iso);
  if (!parts) return iso;
  const [year, month, day] = parts;
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Tydzień ciąży liczony od terminu porodu (40+0). */
export function pregnancyWeek(dueISO: string): { week: number; daysLeft: number } {
  const due = Date.parse(`${dueISO}T00:00:00Z`);
  const today = Date.parse(`${todayISO()}T00:00:00Z`);
  const daysUntilDue = Math.round((due - today) / DAY);
  const daysLeft = Math.max(0, daysUntilDue);
  const week = Math.min(42, Math.max(1, 40 - Math.floor(daysLeft / 7)));
  return { week, daysLeft };
}

/** Wiek dziecka w pełnych miesiącach, ograniczony do zakresu treści aplikacji. */
export function childAgeMonths(birthISO: string): number {
  const birth = dateFromISO(birthISO);
  const now = new Date();
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (now.getDate() < birth.getDate()) months -= 1;
  return Math.max(0, Math.min(48, months));
}
