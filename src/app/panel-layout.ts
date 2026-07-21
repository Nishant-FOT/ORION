import type { AppContext, AppModule } from '@/app/app-context';
import type { MapLayers } from '@/types';

export interface PanelLayoutManagerCallbacks {
  openCountryStory: (code: string, name: string) => void;
  openCountryBrief: (code: string) => void;
  loadAllData: (forceAll?: boolean) => Promise<void>;
  primeVisiblePanels?: () => void;
  updateMonitorResults: () => void;
  loadSecurityAdvisories?: () => Promise<void>;
  applyMapLayerChange?: (layer: keyof MapLayers, enabled: boolean, source: 'programmatic') => void;
}

export class PanelLayoutManager implements AppModule {
  constructor(_ctx: AppContext, _callbacks: PanelLayoutManagerCallbacks) {}

  async init(): Promise<void> {}
  destroy(): void {}
  applyPanelSettings(): void {}
  applySavedPanelOrder(_panelOrder?: string[]): void {}
  ensureCorrectZones(): void {}
  renderCriticalBanner(_postures: unknown[]): void {}
  getIntelTickerBar(): unknown { return null; }
  mountLiveNewsIfReady(): void {}
}
