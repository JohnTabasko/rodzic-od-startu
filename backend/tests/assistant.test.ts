import assert from 'node:assert/strict';
import test from 'node:test';
import { answer } from '../src/assistant';

test('assistant always prioritises the safety protocol', async () => {
  const result = await answer('Mam krwawienie i silny ból');
  assert.equal(result.isSafety, true);
  assert.equal(result.mode, 'crisis');
  assert.match(result.answer, /112/);
});

test('assistant retrieves a reviewed knowledge document', async () => {
  const result = await answer('Kiedy powinnam zrobić badanie OGTT?');
  assert.equal(result.isSafety, false);
  assert.equal(result.docId, 'kb-ogtt');
  assert.equal(result.reviewedAt, '2026-06-15');
  assert.equal(result.mode, 'extractive');
});
