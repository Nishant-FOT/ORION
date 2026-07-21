import { fetchWebcams, fetchWebcamImage, WEBCAM_CATEGORIES, type WebcamEntry, type GetWebcamImageResponse } from '@/services/webcams/index';
import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';
import { isPinned, pinWebcam, unpinWebcam, onPinnedChange } from '@/services/webcams/pinned-store';

interface WebcamCard {
  entry: WebcamEntry;
  image: GetWebcamImageResponse | null;
}

const DEMO_WEBCAMS: WebcamCard[] = [
  { entry: { webcamId: 'wc-1', title: 'Dubai Marina Skyline', lat: 25.08, lng: 55.14, category: 'city', country: 'UAE' } as WebcamEntry, image: null },
  { entry: { webcamId: 'wc-2', title: 'Panama Canal Locks', lat: 9.0, lng: -79.55, category: 'harbor', country: 'Panama' } as WebcamEntry, image: null },
  { entry: { webcamId: 'wc-3', title: 'Suez Canal Traffic', lat: 30.58, lng: 32.34, category: 'harbor', country: 'Egypt' } as WebcamEntry, image: null },
];

export class WebcamsPanel {
  private container: HTMLElement;
  private webcams: WebcamCard[] = [];
  private unsubscribePinned?: () => void;
  private source: DataSource = 'cached';

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> {
    await this.fetchData();
    this.render();
    this.bindEvents();
    this.unsubscribePinned = onPinnedChange(() => this.render());
  }

  private async fetchData(): Promise<void> {
    const { data, source } = await fetchPanelData<WebcamCard[]>(
      { name: 'webcams', fallback: DEMO_WEBCAMS},
      async () => {
        const resp = await fetchWebcams(3, { w: -180, s: -60, e: 180, n: 75 });
        const entries = resp.webcams.slice(0, 20);
        const cards: WebcamCard[] = [];
        const imagePromises = entries.slice(0, 6).map(e => fetchWebcamImage(e.webcamId));
        const images = await Promise.allSettled(imagePromises);
        entries.forEach((entry, i) => {
          const imgResult = i < images.length ? images[i] : null;
          cards.push({
            entry,
            image: imgResult?.status === 'fulfilled' ? imgResult.value : null,
          });
        });
        return cards.length > 0 ? cards : DEMO_WEBCAMS;
      },
    );
    this.webcams = data;
    this.source = source;
  }

  private categoryStyle(cat: string) {
    return WEBCAM_CATEGORIES[cat] ?? WEBCAM_CATEGORIES.other!;
  }

  private bindEvents(): void {
    this.container.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;

      const pinBtn = target.closest('[data-pin]') as HTMLElement | null;
      if (pinBtn) {
        const id = pinBtn.getAttribute('data-pin')!;
        const card = this.webcams.find(c => c.entry.webcamId === id);
        if (!card) return;
        if (isPinned(id)) {
          unpinWebcam(id);
        } else {
          pinWebcam({
            webcamId: card.entry.webcamId,
            title: card.entry.title,
            lat: card.entry.lat,
            lng: card.entry.lng,
            category: card.entry.category,
            country: card.entry.country,
            playerUrl: card.image?.playerUrl || card.image?.windyUrl || '',
          });
        }
      }

      const openBtn = target.closest('[data-open]') as HTMLElement | null;
      if (openBtn) {
        const url = openBtn.getAttribute('data-open')!;
        if (url) window.open(url, '_blank', 'noopener');
      }
    });
  }

  render(): void {
    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Live Webcams</h3>
        <div class="flex items-center gap-2">
          ${renderDataBadge(this.source)}
          <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          <span class="text-xs text-on-surface-variant font-data-md">${this.webcams.length} feeds</span>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-2 panel-list" style="max-height: calc(100% - 48px); overflow-y: auto;">
        ${this.webcams.map((card, i) => {
          const cat = this.categoryStyle(card.entry.category);
          const pinned = isPinned(card.entry.webcamId);
          const playerUrl = card.image?.playerUrl || card.image?.windyUrl || `https://www.windy.com/webcams/${card.entry.webcamId}`;
          return `
            <div class="relative rounded-xl overflow-hidden bg-black/40 group cursor-pointer" style="animation: fadeInUp 0.4s ease-out ${0.04 * i}s both;">
              ${card.image?.thumbnailUrl
                ? `<img src="${card.image.thumbnailUrl}" alt="${card.entry.title}" class="w-full h-28 object-cover opacity-90 group-hover:opacity-100 transition-opacity" loading="lazy" />`
                : `<div class="w-full h-28 flex items-center justify-center bg-white/5">
                    <span class="material-symbols-outlined text-2xl text-on-surface-variant/30">videocam</span>
                  </div>`
              }
              <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
              <div class="absolute bottom-0 left-0 right-0 p-2">
                <div class="text-[11px] text-on-surface font-body-sm leading-tight truncate">${card.entry.title}</div>
                <div class="flex items-center gap-1 mt-0.5">
                  <span class="text-[9px]">${cat.emoji}</span>
                  <span class="text-[9px] text-on-surface-variant/60 font-data-md">${card.entry.country}</span>
                </div>
              </div>
              <div class="absolute top-1.5 right-1.5 flex gap-1">
                <button data-pin="${card.entry.webcamId}" class="w-6 h-6 rounded-full flex items-center justify-center transition-all ${pinned ? 'bg-primary/20 text-primary' : 'bg-black/40 text-on-surface-variant/60 hover:bg-white/10 hover:text-on-surface'}" title="${pinned ? 'Unpin' : 'Pin'}">
                  <span class="material-symbols-outlined text-xs">${pinned ? 'push_pin' : 'add'}</span>
                </button>
                <button data-open="${playerUrl}" class="w-6 h-6 rounded-full bg-black/40 flex items-center justify-center text-on-surface-variant/60 hover:bg-white/10 hover:text-on-surface transition-all" title="Open stream">
                  <span class="material-symbols-outlined text-xs">open_in_new</span>
                </button>
              </div>
              ${card.image?.error ? `<div class="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-error/20 text-error text-[9px] font-data-md">OFFLINE</div>` : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  destroy(): void {
    this.unsubscribePinned?.();
    this.container.innerHTML = '';
  }
}
