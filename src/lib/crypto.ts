/**
 * Cryptographic utility for secure password hashing and verification
 * Uses Web Crypto API SHA-256 with salt.
 * Ensures passwords are never stored as plain text.
 */

const SALT = 'sms_secure_salt_2026_springfield_academy';

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${SALT}:${password.trim()}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(password: string, expectedHash: string): Promise<boolean> {
  if (!password || !expectedHash) return false;
  const computedHash = await hashPassword(password);
  return computedHash === expectedHash;
}
