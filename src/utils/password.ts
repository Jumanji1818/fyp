import { pbkdf2 } from '@noble/hashes/pbkdf2';
import { sha256 } from '@noble/hashes/sha256';

// PBKDF2-HMAC-SHA256 with a per-user random salt. Passwords are never stored or logged in plain text.
const ITERATIONS = 120_000;

const toB64 = (u: Uint8Array) => btoa(String.fromCharCode(...u));
const fromB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

export interface PasswordRecord {
  passwordSalt: string;
  passwordHash: string;
}

export function createPasswordRecord(password: string, saltB64?: string): PasswordRecord {
  const salt = saltB64 ? fromB64(saltB64) : crypto.getRandomValues(new Uint8Array(16));
  const hash = pbkdf2(sha256, new TextEncoder().encode(password), salt, { c: ITERATIONS, dkLen: 32 });
  return { passwordSalt: toB64(salt), passwordHash: toB64(hash) };
}

export function verifyPassword(password: string, rec: Partial<PasswordRecord> | undefined | null): boolean {
  if (!rec?.passwordSalt || !rec.passwordHash) return false;
  const test = createPasswordRecord(password, rec.passwordSalt).passwordHash;
  // constant-time style comparison
  if (test.length !== rec.passwordHash.length) return false;
  let diff = 0;
  for (let i = 0; i < test.length; i++) diff |= test.charCodeAt(i) ^ rec.passwordHash.charCodeAt(i);
  return diff === 0;
}

/** Returns an error message, or null if the password is acceptable. */
export function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'Password must contain letters and at least one number.';
  return null;
}

export function generateTempPassword(): string {
  const words = ['Cedar', 'Maple', 'Harbor', 'Falcon', 'Amber', 'Sahel', 'Delta', 'Baobab'];
  const w = words[crypto.getRandomValues(new Uint32Array(1))[0] % words.length];
  const n = 1000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 9000);
  return `${w}#${n}`;
}

/** Security answers are compared normalised (case/space-insensitive) and stored hashed. */
export const normalizeAnswer = (a: string) => a.trim().toLowerCase().replace(/\s+/g, ' ');
