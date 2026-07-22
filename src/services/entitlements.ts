export type EntitlementState = {
  tier: number;
  features: Record<string, boolean>;
  validUntil: number;
};

export function getEntitlementsSync(): EntitlementState {
  return { tier: 1, features: {}, validUntil: Date.now() + 86400000 };
}

export async function getEntitlements(_userId?: string | null): Promise<EntitlementState> {
  return getEntitlementsSync();
}

export function getEntitlementState(): EntitlementState {
  return getEntitlementsSync();
}

export function hasTier(_tier: number): boolean {
  return true;
}
