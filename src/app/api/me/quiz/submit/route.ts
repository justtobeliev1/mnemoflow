import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateAuth } from '@/lib/supabase-server';
import { handleApiError } from '@/lib/errors';
import { FSRSRatingSchema } from '@/lib/validators/review.schemas';
import { updateWordProgressForUser } from '@/services/review.service';

const SubmitSchema = z.object({
  quiz_word_id: z.coerce.number().int().positive(),
  selected_word_id: z.coerce.number().int().positive(),
  rating: FSRSRatingSchema,
});

/**
 * POST /api/me/quiz/submit
 *
 * 判定作答正误并更新 FSRS 进度
 */
export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await validateAuth(request);

    const body = await request.json();
    const { quiz_word_id, selected_word_id, rating } = SubmitSchema.parse(body);

    const isCorrect = quiz_word_id === selected_word_id;

    const updated = await updateWordProgressForUser({
      supabase,
      userId: user.id,
      wordId: quiz_word_id,
      data: { rating },
    });

    return NextResponse.json({
      is_correct: isCorrect,
      updated_progress: updated,
    }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}


