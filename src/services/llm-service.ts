export type LLMProvider = 'gemini' | 'qwen' | 'deepseek' | 'ollama' | 'local';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  provider: LLMProvider;
  tokensUsed: number;
  latencyMs: number;
}

export interface LLMConfig {
  provider: LLMProvider;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

const PROVIDER_CONFIGS: Record<LLMProvider, { endpoint: string; model: string; maxRPM: number }> = {
  gemini: {
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
    model: 'gemini-2.0-flash',
    maxRPM: 15,
  },
  qwen: {
    endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: 'qwen-turbo',
    maxRPM: 10,
  },
  deepseek: {
    endpoint: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    maxRPM: 5,
  },
  ollama: {
    endpoint: 'http://localhost:11434/v1',
    model: 'llama3.2',
    maxRPM: 999,
  },
  local: {
    endpoint: '',
    model: '',
    maxRPM: 999,
  },
};

class RateLimiter {
  private calls: Map<LLMProvider, number[]> = new Map();

  canCall(provider: LLMProvider): boolean {
    const config = PROVIDER_CONFIGS[provider];
    const now = Date.now();
    const calls = this.calls.get(provider) || [];
    const recentCalls = calls.filter(t => now - t < 60_000);
    this.calls.set(provider, recentCalls);
    return recentCalls.length < config.maxRPM;
  }

  record(provider: LLMProvider): void {
    const calls = this.calls.get(provider) || [];
    calls.push(Date.now());
    this.calls.set(provider, calls);
  }
}

const rateLimiter = new RateLimiter();
const responseCache = new Map<string, { response: LLMResponse; expiry: number }>();

function getCacheKey(messages: LLMMessage[], config: LLMConfig): string {
  return `${config.provider}:${config.model || ''}:${JSON.stringify(messages)}`;
}

async function callGemini(messages: LLMMessage[], config: LLMConfig): Promise<LLMResponse> {
  const apiKey = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error('Gemini API key not configured');

  const model = config.model || PROVIDER_CONFIGS.gemini.model;
  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
  const systemInstruction = messages.find(m => m.role === 'system');

  const startTime = Date.now();
  const response = await fetch(`${PROVIDER_CONFIGS.gemini.endpoint}/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction.content }] } : undefined,
      generationConfig: {
        maxOutputTokens: config.maxTokens || 2048,
        temperature: config.temperature ?? 0.7,
      },
    }),
  });

  if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  return {
    content,
    provider: 'gemini',
    tokensUsed: data.usageMetadata?.totalTokenCount || 0,
    latencyMs: Date.now() - startTime,
  };
}

async function callOpenAICompatible(
  messages: LLMMessage[],
  config: LLMConfig,
  provider: LLMProvider,
): Promise<LLMResponse> {
  const providerConfig = PROVIDER_CONFIGS[provider];
  const model = config.model || providerConfig.model;

  const apiKey = (import.meta as unknown as { env?: Record<string, string> }).env?.[`VITE_${provider.toUpperCase()}_API_KEY`];
  if (!apiKey) throw new Error(`${provider} API key not configured`);

  const startTime = Date.now();
  const response = await fetch(`${providerConfig.endpoint}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: config.maxTokens || 2048,
      temperature: config.temperature ?? 0.7,
    }),
  });

  if (!response.ok) throw new Error(`${provider} API error: ${response.status}`);
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';

  return {
    content,
    provider,
    tokensUsed: data.usage?.total_tokens || 0,
    latencyMs: Date.now() - startTime,
  };
}

async function callOllama(messages: LLMMessage[], config: LLMConfig): Promise<LLMResponse> {
  const model = config.model || PROVIDER_CONFIGS.ollama.model;

  const startTime = Date.now();
  const response = await fetch(`${PROVIDER_CONFIGS.ollama.endpoint}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: config.maxTokens || 2048,
      temperature: config.temperature ?? 0.7,
    }),
  });

  if (!response.ok) throw new Error(`Ollama API error: ${response.status}`);
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';

  return {
    content,
    provider: 'ollama',
    tokensUsed: data.usage?.total_tokens || 0,
    latencyMs: Date.now() - startTime,
  };
}

const PROVIDER_CALLERS: Record<LLMProvider, (messages: LLMMessage[], config: LLMConfig) => Promise<LLMResponse>> = {
  gemini: callGemini,
  qwen: (msgs, cfg) => callOpenAICompatible(msgs, cfg, 'qwen'),
  deepseek: (msgs, cfg) => callOpenAICompatible(msgs, cfg, 'deepseek'),
  ollama: callOllama,
  local: async () => { throw new Error('Local model not configured'); },
};

const PROVIDOR_FALLBACK_ORDER: LLMProvider[] = ['gemini', 'qwen', 'deepseek', 'ollama'];

export async function callLLM(
  messages: LLMMessage[],
  config: Partial<LLMConfig> = {},
): Promise<LLMResponse> {
  const fullConfig: LLMConfig = {
    provider: config.provider || 'gemini',
    model: config.model,
    maxTokens: config.maxTokens || 2048,
    temperature: config.temperature ?? 0.7,
  };

  const cacheKey = getCacheKey(messages, fullConfig);
  const cached = responseCache.get(cacheKey);
  if (cached && cached.expiry > Date.now()) {
    return cached.response;
  }

  const providers = [fullConfig.provider, ...PROVIDOR_FALLBACK_ORDER.filter(p => p !== fullConfig.provider)];

  for (const provider of providers) {
    if (!rateLimiter.canCall(provider)) continue;

    try {
      rateLimiter.record(provider);
      const response = await PROVIDER_CALLERS[provider](messages, { ...fullConfig, provider });

      responseCache.set(cacheKey, {
        response,
        expiry: Date.now() + 30 * 60 * 1000,
      });

      return response;
    } catch (error) {
      console.warn(`[LLM] ${provider} failed:`, error);
      continue;
    }
  }

  throw new Error('All LLM providers failed or unavailable');
}

export async function analyzeWithLLM(
  prompt: string,
  context: string = '',
  config: Partial<LLMConfig> = {},
): Promise<string> {
  const messages: LLMMessage[] = [
    {
      role: 'system',
      content: `You are ORION, an AI-powered energy supply chain intelligence analyst. Provide concise, actionable analysis. Focus on risks, impacts, and recommended actions. Use structured format with clear sections. Current time: ${new Date().toISOString()}`,
    },
    ...(context ? [{ role: 'user' as const, content: `Context:\n${context}` }] : []),
    { role: 'user', content: prompt },
  ];

  const response = await callLLM(messages, config);
  return response.content;
}

export function clearLLMCache(): void {
  responseCache.clear();
}

export function getLLMStatus(): Record<LLMProvider, { available: boolean; rateLimited: boolean }> {
  const status: Record<LLMProvider, { available: boolean; rateLimited: boolean }> = {
    gemini: { available: true, rateLimited: !rateLimiter.canCall('gemini') },
    qwen: { available: true, rateLimited: !rateLimiter.canCall('qwen') },
    deepseek: { available: true, rateLimited: !rateLimiter.canCall('deepseek') },
    ollama: { available: true, rateLimited: false },
    local: { available: false, rateLimited: false },
  };
  return status;
}
