import type { AppContext, AppModule } from '@/app/app-context';

export interface RefreshRegistration {
  name: string;
  fn: () => Promise<boolean | void>;
  intervalMs: number;
  condition?: () => boolean;
  runImmediately?: boolean;
}

export class RefreshScheduler implements AppModule {
  constructor(_ctx: AppContext) {}

  init(): void {}
  destroy(): void {}
  setHiddenSince(_ts: number): void {}
  getHiddenSince(): number { return 0; }

  scheduleRefresh(
    _name: string,
    _fn: () => Promise<boolean | void>,
    _intervalMs: number,
    _condition?: () => boolean,
    _options?: { runImmediately?: boolean },
  ): void {}

  registerAll(_registrations: RefreshRegistration[]): void {}
  flushStaleRefreshes(): void {}
}
