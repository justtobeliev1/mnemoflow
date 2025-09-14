import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseFromRequest } from '@/lib/supabase-server';
import { getChatHistoryForWord, saveChatHistory } from '@/services/chat.service';
import { handleApiError } from '@/lib/errors';
import { z } from 'zod';

const getRequestSchema = z.object({
  wordId: z.coerce.number(),
});

const postRequestSchema = z.object({
  wordId: z.coerce.number(),
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseFromRequest(request);
    const user = await (await import('@/lib/supabase-server')).getUserWithRetry(supabase);

    const { searchParams } = new URL(request.url);
    const { wordId } = getRequestSchema.parse({
      wordId: searchParams.get('wordId'),
    });
    console.log(`[chat-history][GET] user=${user.id} wordId=${wordId}`);
    
    const history = await getChatHistoryForWord({ supabase, userId: user.id, wordId });
    const len = (history && Array.isArray((history as any).conversation_log)) ? (history as any).conversation_log.length : null;
    console.log(`[chat-history][GET] row=${history ? 'hit' : 'miss'} length=${len}`);

    return NextResponse.json(history ?? {});
  } catch (error) {
    console.error('[chat-history][GET][error]', error);
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseFromRequest(request);
    const user = await (await import('@/lib/supabase-server')).getUserWithRetry(supabase);
    
    const body = await request.json();
    const { wordId, messages } = postRequestSchema.parse(body);
    console.log(`[chat-history][POST] user=${user.id} wordId=${wordId} msgs=${messages.length}`);

    const result = await saveChatHistory({ supabase, userId: user.id, wordId, messages });
    const savedLen = Array.isArray((result as any)?.conversation_log) ? (result as any).conversation_log.length : null;
    console.log(`[chat-history][POST] saved length=${savedLen}`);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[chat-history][POST][error]', error);
    return handleApiError(error);
  }
}
