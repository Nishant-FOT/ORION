import { fetchLiveVideoInfo } from '@/services/live-news';
import { requestLiveMediaPlayback, stopLiveMediaPlayback } from '@/services/live-media-controller';
import { getLiveStreamsAlwaysOn } from '@/services/live-stream-settings';

interface LiveChannel {
  handle: string;
  name: string;
  region: string;
  videoId?: string;
}

const LIVE_CHANNELS: LiveChannel[] = [
  { handle: '@AlJazeeraEnglish', name: 'Al Jazeera', region: 'MENA' },
  { handle: '@Reuters', name: 'Reuters', region: 'Global' },
  { handle: '@SkyNews', name: 'Sky News', region: 'UK' },
  { handle: '@FRANCE24english', name: 'France 24', region: 'Europe' },
  { handle: '@CGTNOfficial', name: 'CGTN', region: 'APAC' },
  { handle: '@BBloomberg', name: 'Bloomberg', region: 'Global', videoId: 'QB5BNdBFujE' },
];

export class LiveNewsPanel {
  private container: HTMLElement;
  private activeChannel: string | null = null;

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> {
    this.render();
    this.bindEvents();
    if (getLiveStreamsAlwaysOn() && LIVE_CHANNELS[0]) {
      await this.playChannel(LIVE_CHANNELS[0].handle);
    }
  }

  private async playChannel(handle: string): Promise<void> {
    const playerSlot = this.container.querySelector('#live-player-slot') as HTMLElement;
    if (!playerSlot) return;

    playerSlot.innerHTML = `<div class="flex items-center justify-center h-[320px] rounded-xl bg-white/5 text-on-surface-variant/40 text-xs"><span class="material-symbols-outlined text-lg mr-1 animate-spin">progress_activity</span> Connecting…</div>`;

    const channel = LIVE_CHANNELS.find(ch => ch.handle === handle);
    const videoId = channel?.videoId ?? (await fetchLiveVideoInfo(handle)).videoId;

    if (videoId) {
      const iframe = document.createElement('iframe');
      iframe.width = '100%';
      iframe.height = '320';
      iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`;
      iframe.allow = 'autoplay; encrypted-media';
      iframe.allowFullscreen = true;
      iframe.className = 'rounded-xl w-full';
      iframe.style.border = 'none';

      requestLiveMediaPlayback(
        'live-news',
        handle,
        () => { playerSlot.innerHTML = ''; playerSlot.appendChild(iframe); this.activeChannel = handle; this.updateActiveBtn(); },
        () => { playerSlot.innerHTML = this.placeholderHtml(); this.activeChannel = null; this.updateActiveBtn(); },
      );
    } else {
      const iframe = document.createElement('iframe');
      iframe.width = '100%';
      iframe.height = '320';
      iframe.src = `https://www.youtube.com/embed?channel=${encodeURIComponent(handle)}&autoplay=1&mute=1`;
      iframe.allow = 'autoplay; encrypted-media';
      iframe.allowFullscreen = true;
      iframe.className = 'rounded-xl w-full';
      iframe.style.border = 'none';

      requestLiveMediaPlayback(
        'live-news',
        handle,
        () => { playerSlot.innerHTML = ''; playerSlot.appendChild(iframe); this.activeChannel = handle; this.updateActiveBtn(); },
        () => { playerSlot.innerHTML = this.placeholderHtml(); this.activeChannel = null; this.updateActiveBtn(); },
      );
    }
  }

  private stopPlayback(): void {
    stopLiveMediaPlayback('live-news', 'user-paused');
  }

  private placeholderHtml(): string {
    return `<span class="material-symbols-outlined text-lg mr-1">videocam</span> Select a live stream`;
  }

  private updateActiveBtn(): void {
    this.container.querySelectorAll('.channel-btn').forEach(btn => {
      const isActive = btn.getAttribute('data-channel') === this.activeChannel;
      btn.classList.toggle('ring-1', isActive);
      btn.classList.toggle('ring-primary', isActive);
      btn.classList.toggle('bg-primary/10', isActive);
      btn.classList.toggle('text-primary', isActive);
    });
  }

  private bindEvents(): void {
    this.container.addEventListener('click', async (e) => {
      const target = e.target as HTMLElement;
      const channelBtn = target.closest('[data-channel]') as HTMLElement | null;
      if (channelBtn) {
        const handle = channelBtn.getAttribute('data-channel')!;
        if (this.activeChannel === handle) {
          this.stopPlayback();
        } else {
          await this.playChannel(handle);
        }
      }
    });
  }

  render(): void {
    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-1">
        <h3 class="font-label-caps text-label-caps text-error uppercase tracking-widest panel-header flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-error animate-pulse"></span>Live
        </h3>
        <span class="text-[10px] text-on-surface-variant/60 font-data-md">YouTube streams</span>
      </div>

      <div id="live-player-slot" class="mb-1 rounded-xl bg-black/40 overflow-hidden min-h-[52px] flex items-center justify-center text-on-surface-variant/40 text-xs">
        ${this.placeholderHtml()}
      </div>

      <div class="flex gap-1.5 flex-wrap">
        ${LIVE_CHANNELS.map(ch => `
          <button data-channel="${ch.handle}" class="channel-btn px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-data-md text-on-surface-variant transition-all">
            <span class="material-symbols-outlined text-xs align-middle mr-0.5">videocam</span>${ch.name}
          </button>
        `).join('')}
      </div>
    `;
  }

  destroy(): void {
    this.stopPlayback();
    this.container.innerHTML = '';
  }
}
