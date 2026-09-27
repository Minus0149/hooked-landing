/** A friend's invite code, as the app issues them: 7 characters, no look-alikes. */
export function inviteCode(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const code = raw.trim().toUpperCase();
  return /^[2-9A-HJ-NP-Z]{7}$/.test(code) ? code : null;
}
