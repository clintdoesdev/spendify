import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";

// scrypt parameters (OWASP baseline). Stored alongside each hash so they can be raised later.
const N = 2 ** 15;
const r = 8;
const p = 1;
const KEY_LENGTH = 64;
const MAX_MEM = 128 * N * r * 2;

function derive(password: string, salt: Buffer, options: ScryptOptions, length: number) {
  return new Promise<Buffer>((resolve, reject) =>
    scrypt(password.normalize("NFKC"), salt, length, options, (err, key) => (err ? reject(err) : resolve(key)))
  );
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await derive(password, salt, { N, r, p, maxmem: MAX_MEM }, KEY_LENGTH);
  return ["scrypt", N, r, p, salt.toString("base64url"), key.toString("base64url")].join("$");
}

export async function verifyPassword(password: string, stored: string) {
  const [scheme, n, rr, pp, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64url");
  const options = { N: Number(n), r: Number(rr), p: Number(pp), maxmem: 128 * Number(n) * Number(rr) * 2 };
  const actual = await derive(password, Buffer.from(salt, "base64url"), options, expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** A real hash to compare against when the email doesn't exist, so timing doesn't reveal it. */
export const DUMMY_HASH = "scrypt$32768$8$1$c3BlbmRpZnktZHVtbXk$" + "A".repeat(86);
