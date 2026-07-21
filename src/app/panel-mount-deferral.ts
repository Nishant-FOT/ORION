export const INITIAL_PANEL_MOUNT_BUDGET_DESKTOP = 8;
export const INITIAL_PANEL_MOUNT_BUDGET_MOBILE = 4;

export interface PanelMountDeferralInput {
  enabled: boolean;
  mountedEnabledCount: number;
  isMobile: boolean;
}

export function getInitialPanelMountBudget(isMobile: boolean): number {
  return isMobile ? INITIAL_PANEL_MOUNT_BUDGET_MOBILE : INITIAL_PANEL_MOUNT_BUDGET_DESKTOP;
}

export function shouldDeferInitialPanelMount(_input: PanelMountDeferralInput): boolean {
  return false;
}

export function createDeferredPanelShell(_panelId: string, _title: string): HTMLElement {
  const el = document.createElement('div');
  el.className = 'panel deferred-panel';
  return el;
}

export function countInteractiveControls(_root: ParentNode): number {
  return 0;
}
