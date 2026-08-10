import type { SharedEvent } from './storage';

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;
const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;

export function isValidISODate(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const match = ISO_DATE_PATTERN.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

export function isValidISODateTime(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    ISO_DATE_TIME_PATTERN.test(value) &&
    !Number.isNaN(Date.parse(value))
  );
}

export function isValidId(value: unknown): value is string {
  return typeof value === 'string' && ID_PATTERN.test(value);
}

export function validateSharedEvent(value: unknown): value is SharedEvent {
  if (!value || typeof value !== 'object') return false;
  const event = value as Partial<SharedEvent>;
  if (!isValidId(event.id) || !isValidISODateTime(event.updatedAt)) return false;
  if (typeof event.deleted === 'boolean' && event.deleted) {
    return event.title === '' && event.date === '';
  }
  if (
    typeof event.title !== 'string' ||
    event.title.trim().length === 0 ||
    event.title.length > 240
  )
    return false;
  if (!isValidISODate(event.date)) return false;
  return event.type === undefined || (typeof event.type === 'string' && event.type.length <= 64);
}

export function validateDeletedIds(value: unknown): value is string[] {
  return Array.isArray(value) && value.length <= 100 && value.every((id) => isValidId(id));
}

export function validateChecklist(
  done: unknown,
  updatedAt: unknown,
): done is Record<string, boolean> {
  if (!done || typeof done !== 'object' || Array.isArray(done)) return false;
  if (!updatedAt || typeof updatedAt !== 'object' || Array.isArray(updatedAt)) return false;

  return Object.entries(done).every(([key, value]) => {
    if (!isValidId(key) || typeof value !== 'boolean') return false;
    const timestamp = (updatedAt as Record<string, unknown>)[key];
    return timestamp === undefined || isValidISODateTime(timestamp);
  });
}

export function validatePostText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length >= 3 && value.length <= 2000;
}
