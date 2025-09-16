/**
 * OpenAI 兼容中转站客户端（无 SDK 版本）
 * - 通过 fetch 调用 OpenAI 风格的 /v1/chat/completions
 * - 支持带抖动的指数退避重试
 */

export type OpenAIProxyOptions = {
  baseUrl?: string; // e.g. https://hiapi.online
  apiKey?: string;  // Bearer Key
  model?: string;   // e.g. gpt-4o-mini 或商家提供的模型名
  timeoutMs?: number;
};

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function withRetry<T>(fn: () => Promise<T>, attempts = 4, baseDelay = 600): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      const delay = baseDelay * Math.pow(2, i) + Math.floor(Math.random() * 250);
      if (i < attempts - 1) await wait(delay);
    }
  }
  throw lastErr;
}

export async function generateMnemonicViaOpenAI(
  word: string,
  definition: any,
  type: 'story' | 'association' | 'visual' | 'phonetic',
  userContext?: string,
  opts?: OpenAIProxyOptions,
  action?: 'initial' | 'regenerate' | 'refine',
  previousContent?: any,
): Promise<string> {
  const baseUrl = opts?.baseUrl || process.env.OPENAI_BASE_URL || 'https://hiapi.online';
  const apiKey = opts?.apiKey || process.env.OPENAI_API_KEY || '';
  const model = opts?.model || process.env.OPENAI_MODEL || 'gpt-4o-mini';
  // 默认 60s，可通过 opts.timeoutMs 覆盖
  const timeoutMs = opts?.timeoutMs || 60000;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY 未配置');
  }

  // 构建任务提示词（独立文件维护）
  const { buildMnemonicPrompt } = await import('@/lib/prompts/mnemonic');
  const userPrompt = buildMnemonicPrompt({
    word,
    definition,
    type,
    userContext,
    action,
    previousContent,
  });

  const call = async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: '你是严谨且擅长中文表达的英语学习助理。' },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        stream: false,
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`OpenAI proxy error ${res.status}: ${text}`);
    }

    const data = await res.json();
    // 兼容 OpenAI 格式
    const content = data?.choices?.[0]?.message?.content || '';
    return String(content).trim();
  };

  try {
    return await withRetry(call, 4, 600);
  } finally {
    // timer 已在 call 内部清除
  }
}


