import { NextRequest, NextResponse } from 'next/server';
import { validateAuth } from '@/lib/supabase-server';
import { submitQuizAnswerAndUpdateProgress } from '@/services/review.service';
import { ReviewProgressUpdateSchema } from '@/lib/validators/review.schemas';
import { handleApiError, createValidationError } from '@/lib/errors';

/**
 * PATCH /api/me/review/progress/{wordId}
 * Deprecated: Delegates to POST /api/me/quiz/submit service for backward compatibility.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { wordId: string } }
) {
  try {
    const { supabase, user } = await validateAuth();

    const wordId = parseInt(params.wordId, 10);
    if (isNaN(wordId) || wordId <= 0) {
      throw createValidationError('无效的单词ID', 'wordId必须是正整数');
    }

    const body = await request.json();
    const validated = ReviewProgressUpdateSchema.parse(body);

    // Delegate to the new server-side FSRS submit function
    const updated = await submitQuizAnswerAndUpdateProgress({
      supabase,
      userId: user.id,
      wordId,
      userRating: validated.rating,
    });

    return NextResponse.json({
      message: '学习进度更新成功',
      progress: updated,
      rating: validated.rating,
    }, { status: 200 });

  } catch (error) {
    return handleApiError(error);
  }
}