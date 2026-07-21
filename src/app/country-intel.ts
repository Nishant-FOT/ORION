import type { AppContext, AppModule } from '@/app/app-context';

export class CountryIntelManager implements AppModule {
  constructor(_ctx: AppContext) {}

  async init(): Promise<void> {}
  destroy(): void {}
  async openCountryBriefByCode(_code: string, _name: string): Promise<void> {}
  refreshOpenBrief(): void {}

  static resolveCountryName(_code: string): string { return ''; }
}
