import test from 'node:test';
import assert from 'node:assert/strict';
import { createSessionToken, hashSessionToken, normalizeEmail, hashPassword, verifyPassword } from './security.js';

test('normalizes email for case-insensitive identity checks', () => {
  assert.equal(normalizeEmail('  Buyer@Example.NG '), 'buyer@example.ng');
});

test('creates opaque session tokens and stores only their digest', () => {
  const first = createSessionToken();
  const second = createSessionToken();
  assert.notEqual(first, second);
  assert.notEqual(hashSessionToken(first), first);
  assert.equal(hashSessionToken(first), hashSessionToken(first));
});

test('password hashing never stores the submitted password and verifies correctly', async () => {
  const plain = 'Procura!Secure2026';
  const hashed = await hashPassword(plain);
  assert.notEqual(hashed, plain);
  assert.equal(await verifyPassword(plain, hashed), true);
  assert.equal(await verifyPassword('wrong-password', hashed), false);
});

test('rejects weak passwords', async () => {
  await assert.rejects(() => hashPassword('short'), /at least 8 characters/);
});