import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

type Account = { id: string; email: string; name: string; passwordHash: string };
const accounts = new Map<string, Account>();
const sessions = new Map<string, { userId: string; expiresAt: number }>();
const passwordResetCodes = new Map<string, { code: string; expiresAt: number }>();

function normalizeEmail(email: string) { return email.trim().toLowerCase(); }
export function hashPassword(password: string) { const salt = randomBytes(16).toString("hex"); return `${salt}:${scryptSync(password, salt, 32).toString("hex")}`; }
export function verifyPassword(password: string, stored: string) { const [salt, digest] = stored.split(":"); if (!salt || !digest) return false; const actual = scryptSync(password, salt, 32); const expected = Buffer.from(digest, "hex"); return actual.length === expected.length && timingSafeEqual(actual, expected); }
export function registerAccount(input: { email: string; password: string; name: string }) { const email = normalizeEmail(input.email); if (accounts.has(email)) throw new Error("EMAIL_EXISTS"); const account = { id: createHash("sha256").update(`${email}:${Date.now()}`).digest("hex").slice(0, 24), email, name: input.name.trim(), passwordHash: hashPassword(input.password) }; accounts.set(email, account); return publicAccount(account); }
export function loginAccount(emailInput: string, password: string) { const account = accounts.get(normalizeEmail(emailInput)); if (!account || !verifyPassword(password, account.passwordHash)) throw new Error("INVALID_CREDENTIALS"); return publicAccount(account); }
export function createSession(userId: string) { const token = randomBytes(32).toString("base64url"); sessions.set(token, { userId, expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 30 }); return token; }
export function getSession(token?: string) { const session = token ? sessions.get(token) : undefined; if (!session || session.expiresAt < Date.now()) return undefined; return [...accounts.values()].map(publicAccount).find((user) => user.id === session.userId); }
export function deleteSession(token?: string) { if (token) sessions.delete(token); }
export function requestPasswordReset(emailInput: string) {
  const email = normalizeEmail(emailInput);
  if (accounts.has(email)) passwordResetCodes.set(email, { code: randomBytes(3).toString("hex").toUpperCase(), expiresAt: Date.now() + 1000 * 60 * 15 });
}
export function resetPassword(input: { email: string; code: string; password: string }) {
  const email = normalizeEmail(input.email);
  const account = accounts.get(email);
  const reset = passwordResetCodes.get(email);
  if (!account || !reset || reset.expiresAt < Date.now() || reset.code !== input.code.trim().toUpperCase()) throw new Error("INVALID_RESET_CODE");
  account.passwordHash = hashPassword(input.password);
  passwordResetCodes.delete(email);
}
function publicAccount(account: Account) { return { id: account.id, email: account.email, name: account.name }; }
