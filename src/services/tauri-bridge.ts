// Stub — Tauri desktop app has been removed. These are no-ops on web.
export function invokeTauri<T>(_cmd: string, _args?: unknown): Promise<T> {
  throw new Error('Tauri desktop app is not available');
}

export function tryInvokeTauri<T>(_cmd: string, _args?: unknown): Promise<T | undefined> {
  return Promise.resolve(undefined);
}

export function hasTauriInvokeBridge(): boolean {
  return false;
}
