import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isValidISODate,
  isValidISODateTime,
  validateChecklist,
  validateDeletedIds,
  validatePostText,
  validateSharedEvent,
} from '../src/validation';

test('validates calendar dates without normalising invalid days', () => {
  assert.equal(isValidISODate('2026-02-28'), true);
  assert.equal(isValidISODate('2026-02-29'), false);
  assert.equal(isValidISODate('2026-02-31'), false);
  assert.equal(isValidISODate('2026-13-01'), false);
});

test('accepts only canonical UTC timestamps', () => {
  assert.equal(isValidISODateTime('2026-08-10T10:20:30.123Z'), true);
  assert.equal(isValidISODateTime('2026-08-10T10:20:30Z'), true);
  assert.equal(isValidISODateTime('2026-08-10 10:20:30'), false);
  assert.equal(isValidISODateTime('not-a-date'), false);
});

test('validates shared events and tombstones', () => {
  assert.equal(
    validateSharedEvent({
      id: 'event-1',
      title: 'Wizyta',
      date: '2026-08-15',
      updatedAt: '2026-08-10T10:20:30.123Z',
    }),
    true,
  );
  assert.equal(
    validateSharedEvent({
      id: 'event-1',
      title: '',
      date: '',
      updatedAt: '2026-08-10T10:20:30.123Z',
      deleted: true,
    }),
    true,
  );
  assert.equal(
    validateSharedEvent({
      id: '__proto__',
      title: 'Niebezpieczne ID',
      date: '2026-08-15',
      updatedAt: '2026-08-10T10:20:30.123Z',
    }),
    false,
  );
});

test('validates bounded checklist and post payloads', () => {
  assert.equal(validateChecklist({ 'bag-1': true }, { 'bag-1': '2026-08-10T10:20:30.123Z' }), true);
  assert.equal(validateChecklist({ 'bag-1': 'yes' }, {}), false);
  assert.equal(validateDeletedIds(['event-1', 'prenatal-1']), true);
  assert.equal(validateDeletedIds(['bad id']), false);
  assert.equal(validatePostText('Dzielę się doświadczeniem.'), true);
  assert.equal(validatePostText('x'), false);
});
