import { NextRequest, NextResponse } from 'next/server';
import { validateAuth } from '@/lib/supabase-server';
import { handleApiError } from '@/lib/errors';

/**
 * GET /api/me/word-lists/with-stats
 * Calls the get_word_lists_with_stats RPC to get all of user's word lists
 * with detailed learning statistics (total, learned, new words).
 * Only returns lists that have new words to learn.
 */
export async function GET(req: NextRequest) {
  try {
    const { supabase, user } = await validateAuth(req);

    const { data, error } = await (supabase as any).rpc('get_word_lists_with_stats', {
      p_user_id: user.id,
    });

    if (error) {
      console.error('RPC get_word_lists_with_stats error:', error);
      throw error;
    }

    return NextResponse.json(data || []);
  } catch (e) {
    return handleApiError(e);
  }
}
