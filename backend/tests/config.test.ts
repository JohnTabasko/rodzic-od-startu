import assert from 'node:assert/strict';
import test from 'node:test';
import { loadConfig } from '../src/config';

test('development config has safe local defaults', () => {
  const config = loadConfig({ NODE_ENV: 'development' });
  assert.equal(config.nodeEnv, 'development');
  assert.equal(config.port, 3000);
  assert.equal(config.corsOrigins, '*');
  assert.equal(config.socialDevMode, false);
});

test('production config rejects missing infrastructure settings', () => {
  assert.throws(
    () => loadConfig({ NODE_ENV: 'production', JWT_SECRET: 'short' }),
    /JWT_SECRET|DATABASE_URL/,
  );
});

test('production config accepts explicit secure settings', () => {
  const config = loadConfig({
    NODE_ENV: 'production',
    JWT_SECRET: 'a'.repeat(48),
    DATABASE_URL: 'postgres://localhost/rodzic',
    CORS_ORIGIN: 'https://app.example.com',
  });
  assert.equal(config.nodeEnv, 'production');
  assert.deepEqual(config.corsOrigins, ['https://app.example.com']);
});
