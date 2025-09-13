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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { searchParams } = new URL(request.url);
    const { wordId } = getRequestSchema.parse({
      wordId: searchParams.get('wordId'),
    });
    
    const history = await getChatHistoryForWord({ supabase, userId: user.id, wordId });

    return NextResponse.json(history);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseFromRequest(request);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');
    
    const body = await request.json();
    const { wordId, messages } = postRequestSchema.parse(body);

    const result = await saveChatHistory({ supabase, userId: user.id, wordId, messages });

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
