const pendingCalls = new Map<string, Map<string, unknown[]>>();

export function enqueuePanelCall(key: string, method: string, args: unknown[]): void {
  if (!pendingCalls.has(key)) pendingCalls.set(key, new Map());
  pendingCalls.get(key)!.set(method, args);
}

export async function replayPendingCalls(key: string, panel: unknown): Promise<void> {
  const calls = pendingCalls.get(key);
  if (!calls || !panel) return;
  for (const [method, args] of calls) {
    const fn = (panel as Record<string, unknown>)[method];
    if (typeof fn === 'function') {
      try { (fn as Function).call(panel, ...args); } catch { /* ignore */ }
    }
  }
  pendingCalls.delete(key);
}

export function clearAllPendingCalls(): void {
  pendingCalls.clear();
}
