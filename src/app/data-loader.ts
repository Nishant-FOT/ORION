import type { AppContext, AppModule } from '@/app/app-context';

export interface DataLoaderCallbacks {
  renderCriticalBanner: (postures: unknown[]) => void;
  refreshOpenCountryBrief: () => void;
}

export class DataLoaderManager implements AppModule {
  updateSearchIndex: () => void = () => {};

  constructor(_ctx: AppContext, _callbacks: DataLoaderCallbacks) {}

  async init(): Promise<void> {}

  async loadAllData(_forceAll?: boolean): Promise<void> {}

  destroy(): void {}
}
