export const DAY = 24 * 60 * 60 * 1000;

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isValidISODate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s));
}

export function formatPL(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function addDays(iso: string, days: number): string {
  return new Date(new Date(iso).getTime() + days * DAY).toISOString().slice(0, 10);
}

/** Tydzień ciąży liczony od terminu porodu (40+0). */
export function pregnancyWeek(dueISO: string): { week: number; daysLeft: number } {
  const due = Date.parse(dueISO);
  const daysLeft = Math.max(0, Math.round((due - Date.now()) / DAY));
  const week = Math.min(42, Math.max(1, 40 - Math.floor(daysLeft / 7)));
  return { week, daysLeft };
}

/** Wiek dziecka w miesiącach liczony od daty urodzenia. */
export function childAgeMonths(birthISO: string): number {
  const birth = new Date(birthISO);
  const now = new Date();
  let m = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (now.getDate() < birth.getDate()) m -= 1;
  return Math.max(0, Math.min(48, m));
}
