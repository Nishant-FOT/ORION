import type { AppContext, AppModule } from '@/app/app-context';
import type { MapLayers } from '@/types';

export interface EventHandlerCallbacks {
  openSearch: (options?: { toggle?: boolean }) => void;
  updateSearchIndex: () => void;
  updateFlightSource?: (adsb: unknown[], military: unknown[]) => void;
  loadAllData: () => Promise<void>;
  flushStaleRefreshes: () => void;
  setHiddenSince: (ts: number) => void;
  loadDataForLayer: (layer: string) => void;
  waitForAisData: () => void;
  syncDataFreshnessWithLayers: () => void;
  ensureCorrectZones: () => void;
  applySavedPanelOrder?: (panelOrder?: string[]) => void;
  refreshCiiAfterFocalPointsReady?: () => void;
  stopLayerActivity?: (layer: keyof MapLayers) => void;
  mountLiveNewsIfReady?: () => void;
}

export class EventHandlerManager implements AppModule {
  constructor(_ctx: AppContext, _callbacks: EventHandlerCallbacks) {}

  init(): void {}
  destroy(): void {}
  performUndo(): void {}
  startHeaderClock(): void {}
  setupPlaybackControl(): void {}
  setupStatusPanel(): void {}
  setupPizzIntIndicator(): void {}
  setupLlmStatusIndicator(): void {}
  setupExportPanel(): void {}
  setupSearchControls(): void {}
  setupUnifiedSettings(): void {}
  setupAuthWidget(): void {}
  setupMapLayerHandlers(): void {}
  setupUrlStateSync(): void {}
  syncUrlState(): void {}
  setupSnapshotSaving(): void {}
  setupPanelViewTracking(): void {}
  enablePanelById(_panelId: string): boolean { return false; }
  applyMapLayerChange(_layer: string, _enabled: boolean, _source: string): void {}
}
