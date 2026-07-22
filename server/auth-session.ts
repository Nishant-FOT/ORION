/**
 * Auth session stub — Clerk removed. Always returns a valid session for
 * any non-empty Bearer token.
 */
export async function validateBearerToken(
  token: string,
): Promise<{ valid: boolean; userId?: string; role?: string }> {
  if (!token) {
    return { valid: false };
  }
  return { valid: true, userId: 'authenticated', role: 'free' };
}
