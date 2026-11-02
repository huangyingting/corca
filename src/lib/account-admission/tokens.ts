import { createHash, randomBytes } from 'node:crypto';

export function createOpaqueToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashOpaqueToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('base64url');
}

/**
 * Generates a human-friendly CorTeX invite code pass: CTX-XXXX-XXXX-XXXX
 */
export function createInvitePassCode(): string {
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const bytes = randomBytes(12);
  let chars = '';
  for (let i = 0; i < 12; i += 1) {
    chars += alphabet[bytes[i] % alphabet.length];
  }
  return `CTX-${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8, 12)}`;
}

export function normalizeInvitePassCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, '');
}

export function hashInvitePassCode(code: string): string {
  return hashOpaqueToken(normalizeInvitePassCode(code));
}
