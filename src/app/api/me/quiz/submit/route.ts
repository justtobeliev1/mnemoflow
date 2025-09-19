import { NextRequest, NextResponse } from 'next/server';
import { validateAuth } from '@/lib/supabase-server';
import { handleApiError, createValidationError } from '@/lib/errors';
import { submitQuizAnswerAndUpdateProgress } from '@/services/review.service';

export async function POST(req: NextRequest) {
  try {
    const { supabase, user } = await validateAuth();
    const body = await req.json();
    const wordId = Number(body?.quiz_word_id ?? body?.word_id);
    const rating = String(body?.rating || '').toLowerCase();
    if (!wordId || !['again','hard','good','easy'].includes(rating)) {
      throw createValidationError('无效的请求', '需要提供 quiz_word_id 与 rating');
    }

    const updated = await submitQuizAnswerAndUpdateProgress({
      supabase,
      userId: user.id,
      wordId,
      userRating: rating as any,
    });

    return NextResponse.json({ updated_progress: updated }, { status: 200 });
  } catch (e) {
    return handleApiError(e);
  }
}


