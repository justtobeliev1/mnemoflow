import { NextRequest } from 'next/server';
import { z } from 'zod';
import { handleApiError } from '@/lib/errors';

const chatRequestSchema = z.object({
  word: z.string(),
  prompt: z.string(),
});

function extractTextFromPayload(json: any): string {
  const out = json?.output;
  if (!out) return '';
  // 增量片段
  const delta = out?.choices?.[0]?.delta?.content;
  if (typeof delta === 'string' && delta.length > 0) return delta;
  // 最终消息
  const finalMsg = out?.choices?.[0]?.message?.content;
  if (typeof finalMsg === 'string' && finalMsg.length > 0) return finalMsg;
  // 兼容文本字段
  const text = out?.text;
  if (typeof text === 'string' && text.length > 0) return text;
  return '';
}

function createSSETextStream(resp: Response) {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      if (!resp.body) {
        controller.close();
        return;
      }
      const reader = (resp.body as ReadableStream<Uint8Array>).getReader();
      let buffer = '';
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n');
          buffer = parts.pop() || '';
          for (const part of parts) {
            // 逐帧解析，兼容含 id:/event:/data: 的多行帧
            const lines = part.split('\n');
            const dataLine = lines.find((l) => l.startsWith('data:'));
            if (!dataLine) continue;
            const payload = dataLine.slice(5).trim();
            if (!payload || payload === '[DONE]') continue;
            try {
              const json = JSON.parse(payload);
              const text = extractTextFromPayload(json);
              if (text) controller.enqueue(encoder.encode(text));
            } catch (_) {}
          }
        }
      } catch (_) {
      } finally {
        controller.close();
      }
    },
  });
}

async function fetchWithTimeoutAndRetry(url: string, options: RequestInit & { timeout?: number } = {}, retries = 2) {
  const { timeout = 25000, ...rest } = options;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const resp = await fetch(url, { ...rest, signal: controller.signal });
      clearTimeout(id);
      return resp;
    } catch (err) {
      clearTimeout(id);
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt)));
    }
  }
  throw new Error('unreachable');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { word, prompt } = chatRequestSchema.parse(body);

    const apiKey = process.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: { code: 'MissingApiKey', message: 'Missing DASHSCOPE_API_KEY in env' } }), { status: 400 });
    }
    const model = process.env.DASHSCOPE_MODEL_ID || 'qwen-turbo';
    const base = process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com';

    const systemPrompt = `你是一个友善且专业的英语学习助手。当前用户正在学习单词 "${word}"。请根据用户的提问，围绕这个单词提供清晰、准确、有帮助的回答。请使用 Markdown 格式进行排版，合理使用列表、粗体、缩进等，让回答易于阅读。避免回答与当前单词学习无关的问题。`;

    const resp = await fetchWithTimeoutAndRetry(`${base}/api/v1/services/aigc/text-generation/generation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        'X-DashScope-SSE': 'enable',
      },
      body: JSON.stringify({
        model,
        input: {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
          ],
        },
        parameters: {
          result_format: 'message',
          incremental_output: true,
        },
      }),
      timeout: 25000,
    }, 2);

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      return new Response(
        JSON.stringify({ error: { code: 'UpstreamError', status: resp.status, model, body: errText } }),
        { status: resp.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const stream = createSSETextStream(resp);
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: error.issues }), { status: 400 });
    }
    return handleApiError(error);
  }
}
