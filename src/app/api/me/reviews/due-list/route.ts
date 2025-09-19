import { NextRequest, NextResponse } from 'next/server';
import { handleApiError, createValidationError } from '@/lib/errors';
import { validateAuth } from '@/lib/supabase-server';

// GET /api/me/reviews/due-list?limit=20
export async function GET(req: NextRequest) {
  try {
    const { supabase, user } = await validateAuth(req);
    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Number(limitParam) : 100;
    if (Number.isNaN(limit) || limit <= 0 || limit > 500) {
      throw createValidationError('limit 参数无效', 'limit 需为 1-500 的正整数');
    }

    const { data, error } = await (supabase as any)
      .rpc('get_due_reviews', { p_user_id: user.id, p_limit: limit });
    if (error) throw error;

    return NextResponse.json({ reviews: Array.isArray(data) ? data : [] }, { status: 200 });
  } catch (e) {
    return handleApiError(e);
  }
}


