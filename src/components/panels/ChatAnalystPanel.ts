interface ChatMessage { role: string; content: string; timestamp: string; }
interface SuggestedQuery { id: string; text: string; category: string; }

export class ChatAnalystPanel {
  private container: HTMLElement;
  private messages: ChatMessage[] = [];
  private suggestions: SuggestedQuery[] = [];
  private loading = false;

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> {
    this.messages = [
      {
        role: 'assistant',
        content: 'Welcome to the Intelligence Analyst. I can help you analyze geopolitical events, assess risk, and explore correlations across intelligence domains. What would you like to investigate?',
        timestamp: new Date().toISOString(),
      },
    ];
    this.suggestions = [
      { id: 's1', text: 'What are the top 3 emerging threats this week?', category: 'THREATS' },
      { id: 's2', text: 'Analyze Hormuz Strait shipping disruptions', category: 'ENERGY' },
      { id: 's3', text: 'Show me Iran proxy network activity', category: 'MILITARY' },
    ];
    this.render();
  }

  private categoryColor(c: string): string {
    const m: Record<string, string> = { THREATS: 'bg-error/10 text-error border-error/20', ENERGY: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20', MILITARY: 'bg-orange-400/10 text-orange-400 border-orange-400/20' };
    return m[c] || 'bg-white/5 text-on-surface-variant border-white/10';
  }

  private async sendMessage(text: string): Promise<void> {
    if (this.loading || !text.trim()) return;
    this.loading = true;

    this.messages.push({ role: 'user', content: text.trim(), timestamp: new Date().toISOString() });
    this.render();

    const assistantIdx = this.messages.length;
    this.messages.push({ role: 'assistant', content: '...', timestamp: new Date().toISOString() });
    this.render();

    try {
      const history = this.messages.slice(1, -1).map(m => ({ role: m.role, content: m.content }));
      const resp = await fetch('/api/chat-analyst', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text.trim(), domainFocus: 'all', history }),
      });

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      const reader = resp.body?.getReader();
      if (!reader) return {} as any;

      const decoder = new TextDecoder();
      let buf = '';
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const payload = JSON.parse(line.slice(6));
            if (payload.delta) {
              fullContent += payload.delta;
              const msg = this.messages[assistantIdx];
              if (msg) msg.content = fullContent;
              this.render();
            }
          } catch { /* skip malformed */ }
        }
      }
    } catch (err) {
      const msg = this.messages[assistantIdx];
      if (msg) msg.content = `Error: ${(err as Error).message}. Make sure the backend is running.`;
    }

    this.loading = false;
    this.render();
  }

  render(): void {
    const inputEl = this.container.querySelector<HTMLInputElement>('#chat-input');
    const inputValue = inputEl?.value ?? '';

    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Analyst Chat</h3>
        <span class="w-2 h-2 rounded-full ${this.loading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}"></span>
      </div>
      <div class="flex flex-col gap-2 mb-3 panel-list chat-messages" style="max-height: calc(100% - 120px); overflow-y: auto;">
        ${this.messages.map((m, i) => `
          <div class="flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}" style="animation: fadeInUp 0.3s ease-out ${0.05 * i}s both;">
            <div class="max-w-[85%] p-3 rounded-xl ${m.role === 'user' ? 'bg-primary/20 text-on-surface' : 'bg-white/5 text-on-surface-variant'}">
              <div class="text-xs leading-relaxed whitespace-pre-wrap">${this.escapeHtml(m.content)}</div>
              <div class="text-[9px] text-on-surface-variant mt-1">${new Date(m.timestamp).toLocaleTimeString()}</div>
            </div>
          </div>
        `).join('')}
      </div>
      ${this.messages.length <= 1 ? `
        <div class="mb-3">
          <div class="text-[10px] font-label-caps text-on-surface-variant mb-2">SUGGESTED QUERIES</div>
          <div class="flex flex-col gap-1.5">
            ${this.suggestions.map(s => `
              <button class="text-left p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all cursor-pointer group suggestion-btn" data-text="${this.escapeAttr(s.text)}">
                <div class="flex items-center gap-2">
                  <span class="text-[9px] font-label-caps px-1.5 py-0.5 rounded border ${this.categoryColor(s.category)}">${s.category}</span>
                  <span class="text-[10px] text-on-surface-variant group-hover:text-on-surface transition-colors">${s.text}</span>
                </div>
              </button>
            `).join('')}
          </div>
        </div>
      ` : ''}
      <div class="flex gap-2">
        <input type="text" id="chat-input" placeholder="Ask the analyst..." value="${this.escapeAttr(inputValue)}" class="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-on-surface placeholder-on-surface-variant focus:outline-none focus:border-primary/50" />
        <button id="chat-send" class="px-3 py-2 bg-primary/20 text-primary text-xs font-label-caps rounded-lg hover:bg-primary/30 transition-all">${this.loading ? '...' : 'SEND'}</button>
      </div>
    `;

    const chatMessages = this.container.querySelector('.chat-messages');
    if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;

    this.container.querySelector('#chat-send')?.addEventListener('click', () => {
      const input = this.container.querySelector<HTMLInputElement>('#chat-input');
      if (input) { this.sendMessage(input.value); input.value = ''; }
    });

    this.container.querySelector('#chat-input')?.addEventListener('keydown', (e: Event) => {
      const ke = e as KeyboardEvent;
      if (ke.key === 'Enter' && !ke.shiftKey) {
        ke.preventDefault();
        const input = this.container.querySelector<HTMLInputElement>('#chat-input');
        if (input) { this.sendMessage(input.value); input.value = ''; }
      }
    });

    this.container.querySelectorAll('.suggestion-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const text = btn.getAttribute('data-text');
        if (text) this.sendMessage(text);
      });
    });
  }

  private escapeHtml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  private escapeAttr(s: string): string {
    return s.replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  destroy(): void { this.container.innerHTML = ''; }
}
