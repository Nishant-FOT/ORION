import type { AppContext, AppModule } from '@/app/app-context';

export interface SearchManagerCallbacks {
  openCountryBriefByCode: (code: string, country: string) => void;
  enablePanel: (panelId: string) => boolean;
}

export class SearchManager implements AppModule {
  constructor(_ctx: AppContext, _callbacks: SearchManagerCallbacks) {}

  init(): void {}
  destroy(): void {}
  updateSearchIndex(): void {}
  updateFlightSource(_adsb: unknown[], _military: unknown[]): void {}
}
