/** Minimal user profile exposed to UI components. */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: 'free' | 'pro';
}

/** Simplified auth session state for UI consumption. */
export interface AuthSession {
  user: AuthUser | null;
  isPending: boolean;
}

const anonymousSession: AuthSession = { user: null, isPending: false };

let _currentSession: AuthSession = anonymousSession;

export async function initAuthState(): Promise<void> {}

export function subscribeAuthState(callback: (state: AuthSession) => void): () => void {
  callback(_currentSession);
  return () => {};
}

export function getAuthState(): AuthSession {
  return _currentSession;
}
