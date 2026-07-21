export const CLOUD_SYNC_KEYS = [
  'orion-panels',
  'orion-monitors',
  'orion-layers',
  'orion-disabled-feeds',
  'orion-panel-spans',
  'orion-panel-col-spans',
  'panel-order',
  'panel-order-bottom-set',
  'orion-theme',
  'orion-variant',
  'orion-map-mode',
  'orion-breaking-alerts-v1',
  'orion-market-watchlist-v1',
  'aviation:watchlist:v1',
  'orion-pinned-webcams',
  'orion-map-provider',
  'orion-font-family',
  'orion-globe-visual-preset',
  'orion-stream-quality',
  'orion-ai-flow-cloud-llm',
  // Sister AI-flow toggles. Without these, the user's "Browser Local Model"
  // and "Headline Memory" prefs reset per variant and disagree with the
  // already-synced Cloud AI toggle — e.g. Headline Memory left on for the
  // full variant silently runs the local ML worker (HuggingFace model
  // downloads) on every page load, but switching to the tech variant shows
  // the toggle as off because tech-variant localStorage is fresh.
  'orion-ai-flow-browser-model',
  'orion-headline-memory',
  'orion-analysis-frameworks',
  'orion-panel-frameworks',
  // Provider-specific map themes (orion-map-theme:<provider>)
  'orion-map-theme:auto',
  'orion-map-theme:pmtiles',
  'orion-map-theme:openfreemap',
  'orion-map-theme:carto',
  // Live-stream mode
  'orion-live-streams-always-on',
] as const;

export type CloudSyncKey = (typeof CLOUD_SYNC_KEYS)[number];
