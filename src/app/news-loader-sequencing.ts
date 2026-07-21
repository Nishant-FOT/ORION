export interface NewsDigestSnapshot<TDigest> {
  digest: TDigest | null;
  pending: boolean;
}

export interface NewsCategorySpec<TFeeds> {
  key: string;
  feeds: TFeeds;
  isCustom?: boolean;
}

export interface NewsCategoryLoadOptions {
  allowDigestPendingFallback: boolean;
  recordBaselineSample: boolean;
}

export interface NewsIntelLoadOptions {
  recordBaselineSample: boolean;
}

export interface NewsCategoryLoadResult<TItem> {
  key: string;
  items: TItem[];
}

export interface RunNewsLoadPassOptions<TFeeds, TDigest, TItem> {
  categories: NewsCategorySpec<TFeeds>[];
  categoryConcurrency: number;
  digestPromise: Promise<TDigest>;
  fallbackDigest?: TDigest;
  digestGraceMs: number;
  allowPendingPerFeedFallback?: boolean;
  hasDigestCategory: (key: string) => boolean;
  loadCategory: (spec: NewsCategorySpec<TFeeds>) => Promise<TItem[]>;
  loadIntel?: () => Promise<TItem[]>;
  onCategoryError?: (key: string, error: unknown) => void;
  onDigestRefreshError?: (error: unknown) => void;
}

export interface RunNewsLoadPassResult<TDigest, TItem> {
  categoryItemsByKey: Map<string, TItem[]>;
  intelItems: TItem[];
  initialDigest: NewsDigestSnapshot<TDigest>;
  finalDigest: TDigest | null;
}

export async function resolveInitialNewsDigest<TDigest>(
  digestPromise: Promise<TDigest>,
  graceMs: number,
  _delay?: number,
  _fallbackDigest?: TDigest,
): Promise<NewsDigestSnapshot<TDigest>> {
  try {
    const digest = await Promise.race([
      digestPromise,
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('digest timeout')), graceMs)),
    ]);
    return { digest, pending: false };
  } catch {
    return { digest: null, pending: true };
  }
}

export async function runNewsLoadPass<TFeeds, TDigest, TItem>(
  options: RunNewsLoadPassOptions<TFeeds, TDigest, TItem>,
): Promise<RunNewsLoadPassResult<TDigest, TItem>> {
  const categoryItemsByKey = new Map<string, TItem[]>();
  let intelItems: TItem[] = [];
  let initialDigest: NewsDigestSnapshot<TDigest> = { digest: null, pending: true };
  let finalDigest: TDigest | null = null;

  try {
    initialDigest = await resolveInitialNewsDigest(options.digestPromise, options.digestGraceMs);
    finalDigest = initialDigest.digest;
  } catch { /* ignore */ }

  const categoryPromises = options.categories.map(async (spec) => {
    try {
      const items = await options.loadCategory(spec);
      categoryItemsByKey.set(spec.key, items);
    } catch (err) {
      options.onCategoryError?.(spec.key, err);
    }
  });

  await Promise.allSettled(categoryPromises);

  if (options.loadIntel) {
    try { intelItems = await options.loadIntel(); } catch { /* ignore */ }
  }

  return { categoryItemsByKey, intelItems, initialDigest, finalDigest };
}
